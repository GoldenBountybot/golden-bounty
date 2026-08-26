// Server-side Solana JSON-RPC proxy. Public Solana endpoints block browser
// (CORS) requests with 403, so the frontend calls this instead. Only the
// methods the deposit flow needs are permitted. Tries several free, no-key
// providers in order and returns the first real answer.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SB_URL = Deno.env.get('SUPABASE_URL');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}

const RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://api2.mainnet-beta.solana.com',
  'https://api.mainnet-beta.solana.com',
];
const ALLOWED = new Set(['getLatestBlockhash', 'sendTransaction', 'getSignatureStatus', 'getAccountInfo', 'getBalance']);

async function rpcForward(method, params) {
  let lastErr = null;
  for (const url of RPC_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (!r.ok) { lastErr = `HTTP ${r.status} from ${url}`; continue; }
      const text = await r.text();
      let j;
      try { j = JSON.parse(text); } catch { lastErr = `non-JSON from ${url}`; continue; }
      // A valid JSON-RPC error is a real answer — surface it instead of
      // masking it by falling through to another endpoint.
      if (j?.error) throw new Error('rpc: ' + (j.error.message || j.error.code));
      return j?.result ?? null;
    } catch (e) { lastErr = String(e?.message || e); }
  }
  throw new Error(lastErr || 'all RPC endpoints failed');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const method = String(body.method || '');
    const params = Array.isArray(body.params) ? body.params : [];
    if (!ALLOWED.has(method)) return json({ ok: false, reason: 'method-not-allowed' });

    const result = await rpcForward(method, params);
    return json({ ok: true, result });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});