// WG request crypto: MD5 check string + AES-ECB-PKCS7/Base64 `param`.
// WebCrypto has no ECB mode, so ECB is built from single-block CBC operations
// with a zero IV (mathematically identical, and the only portable way on Deno).
import md5 from 'https://esm.sh/js-md5@0.8.3';

const ZERO = new Uint8Array(16);
const enc = new TextEncoder();
const dec = new TextDecoder();

export const md5hex = (s: string): string => md5(s);

// key = MD5(agent + timestamp + MD5Key)
export const makeKey = (agent: string, timestamp: string, md5Key: string) =>
  md5hex(`${agent}${timestamp}${md5Key}`);

const b64encode = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const b64decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function pkcs7(data: Uint8Array): Uint8Array {
  const pad = 16 - (data.length % 16);
  const out = new Uint8Array(data.length + pad);
  out.set(data);
  out.fill(pad, data.length);
  return out;
}

const importKey = (desKey: string) =>
  crypto.subtle.importKey('raw', enc.encode(desKey), { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);

async function ecbEncryptBlock(key: CryptoKey, block: Uint8Array): Promise<Uint8Array> {
  const out = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: ZERO }, key, block));
  return out.slice(0, 16); // drop WebCrypto's own padding block
}

/** aes.Encrypt(param, DesKey) — AES/ECB/PKCS7, Base64 out. */
export async function aesEcbEncrypt(plain: string, desKey: string): Promise<string> {
  const key = await importKey(desKey);
  const data = pkcs7(enc.encode(plain));
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 16) {
    out.set(await ecbEncryptBlock(key, data.subarray(i, i + 16)), i);
  }
  return b64encode(out);
}

/** Reverse of the above: Base64 ciphertext -> the original param string. */
export async function aesEcbDecrypt(b64: string, desKey: string): Promise<string> {
  const key = await importKey(desKey);
  const c = b64decode(b64);
  if (!c.length || c.length % 16) throw new Error('bad ciphertext length');

  // Append a block whose CBC-decryption is valid PKCS7 padding, so WebCrypto
  // accepts the buffer; everything before it decrypts as CBC and is un-chained.
  const last = c.subarray(c.length - 16);
  const x = new Uint8Array(16);
  for (let i = 0; i < 16; i++) x[i] = 16 ^ last[i];
  const extra = await ecbEncryptBlock(key, x);

  const buf = new Uint8Array(c.length + 16);
  buf.set(c);
  buf.set(extra, c.length);
  const cbc = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ZERO }, key, buf));

  const out = new Uint8Array(c.length);
  for (let i = 0; i < c.length; i += 16) {
    const prev = i === 0 ? ZERO : c.subarray(i - 16, i);
    for (let j = 0; j < 16; j++) out[i + j] = cbc[i + j] ^ prev[j];
  }
  const padLen = out[out.length - 1];
  return dec.decode(out.subarray(0, out.length - (padLen > 0 && padLen <= 16 ? padLen : 0)));
}

/** param string ("a=1&b=2") -> flat map. Values are URL-decoded. */
export function parseParam(param: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(param)) out[k] = v;
  return out;
}