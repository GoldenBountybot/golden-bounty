import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Phantom deep-link (universal link) crypto + session helpers.
// This bypasses the injected window.phantom.solana provider entirely —
// connection + signing happen in the native Phantom app via universal links,
// which is the reliable flow on mobile (the injected-provider connect popup
// is a known Phantom bug on some devices after a prior connection).

const STORAGE_KEY = 'phantom_dl_v2';

export function buildPhantomUrl(path, params) {
  return `https://phantom.app/ul/v1/${path}?${params.toString()}`;
}

export function newDappKeyPair() {
  return nacl.box.keyPair();
}

export function deriveSharedSecret(phantomEncPubKeyB58, dappSecretKey) {
  return nacl.box.before(bs58.decode(phantomEncPubKeyB58), dappSecretKey);
}

export function encryptPayload(payload, sharedSecret) {
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.box.after(
    new TextEncoder().encode(JSON.stringify(payload)),
    nonce,
    sharedSecret
  );
  return [nonce, encrypted];
}

export function decryptPayload(dataB58, nonceB58, sharedSecret) {
  const decrypted = nacl.box.open.after(bs58.decode(dataB58), bs58.decode(nonceB58), sharedSecret);
  if (!decrypted) throw new Error('Unable to decrypt Phantom payload');
  return JSON.parse(new TextDecoder().decode(decrypted));
}

export function b58Encode(bytes) { return bs58.encode(bytes); }
export function b58Decode(str) { return bs58.decode(str); }

// localStorage (NOT sessionStorage) — Phantom's redirect back to the browser
// often opens a NEW tab on mobile, and sessionStorage is per-tab. localStorage
// is shared across all tabs of the same origin, so the dapp keypair + session
// survive the round-trip even when the return lands in a fresh tab.
export function loadPhantomSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
export function savePhantomSession(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function clearPhantomSession() {
  localStorage.removeItem(STORAGE_KEY);
}