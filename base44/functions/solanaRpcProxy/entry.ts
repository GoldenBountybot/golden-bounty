import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Server-side Solana JSON-RPC proxy. The public Solana endpoint
// (api.mainnet-beta.solana.com) blocks browser/CORS requests with 403, so the
// frontend cannot call it directly. This function forwards allowed read +
// sendTransaction calls server-side (no CORS restriction) and returns the
// raw result. Only the methods the deposit flow needs are permitted.
// Solana public mainnet-beta endpoint blocks many IPs (browser CORS AND some
// server IPs) with 403, so we try several free, no-key RPC providers in order
// and return the first successful response.
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
      // A valid JSON-RPC response (even an error) is a real answer from a
      // working endpoint — surface it instead of masking it by falling
      // through to another endpoint. Only unreachable endpoints fall through.
      if (j?.error) throw new Error('rpc: ' + (j.error.message || j.error.code));
      return j?.result ?? null;
    } catch (e) { lastErr = String(e?.message || e); }
  }
  throw new Error(lastErr || 'all RPC endpoints failed');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const method = String(body.method || '');
    const params = Array.isArray(body.params) ? body.params : [];
    if (!ALLOWED.has(method)) return Response.json({ ok: false, reason: 'method-not-allowed' });

    const result = await rpcForward(method, params);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});