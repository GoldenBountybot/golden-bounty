
import { AGENT, API_URL, DES_KEY, MD5_KEY, SECRET_TOKEN } from '../_shared/wg.ts';
import { pgFetch } from '../_shared/pgsoft.ts';
import { aesEcbEncrypt, makeKey } from '../_shared/wgCrypto.ts';

// Appends WG's operator identifier to a WG-bound param string.
const withToken = (parts: string[]) => [...parts, 'secretToken=' + SECRET_TOKEN].join('&');

const call = async (param: string) => {
  const ts = String(Date.now());
  const qs = new URLSearchParams({
    agent: AGENT, timestamp: ts,
    param: await aesEcbEncrypt(param, DES_KEY),
    key: makeKey(AGENT, ts, MD5_KEY),
  }).toString();
  const endpoint = /\/api$/.test(API_URL) ? API_URL : API_URL + '/api';
  const res = await pgFetch(endpoint + '?' + qs, { method: 'GET' });
  const text = await res.text();
  return { httpStatus: res.status, wgResponse: text.slice(0, 400) };
};

Deno.serve(async (req) => {
  if (new URL(req.url).searchParams.get('t') !== 'gb-5pky4p3rxem') return new Response('no', { status: 403 });
  const acct = 'probe' + Date.now();
  const sid = crypto.randomUUID().replace(/-/g, '');
  const base = ['s=1','account=' + acct,'ip=8.8.8.8','kindId=1','lang=en','lineCode=goldenbounty','sessionId=' + sid];
  const out: Record<string, unknown> = {
    config: {
      agentLen: AGENT.length, md5Len: MD5_KEY.length, desLen: DES_KEY.length,
      hasOperatorId: SECRET_TOKEN.length > 0,
      apiHost: (() => { try { return new URL(API_URL).host + new URL(API_URL).pathname; } catch { return 'INVALID_URL'; } })(),
    },
  };
  out.launch_withToken = await call(withToken(base));
  out.launch_noToken = await call(base.join('&'));
  out.balance = await call(withToken(['s=2','account=' + acct]));
  out.gameList = await call(withToken(['s=10']));
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json' } });
});
