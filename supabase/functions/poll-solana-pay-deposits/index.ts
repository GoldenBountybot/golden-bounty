import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
async function authUser(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}
async function requireAdmin(req: Request) {
  const user = await authUser(req);
  if (!user) return { err: json({ error: 'Unauthorized' }, 401) };
  const { data: p } = await svc.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (p?.role !== 'admin') return { err: json({ error: 'Forbidden' }, 403) };
  return { user };
}

const RPC_ENDPOINTS = ['https://solana-rpc.publicnode.com', 'https://api2.mainnet-beta.solana.com'];
const ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
async function rpc(method: string, params: any[]) {
  let lastErr: string | null = null;
  for (const url of RPC_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) { lastErr = 'HTTP ' + r.status; continue; }
      const j = await r.json();
      if (j?.error) throw new Error('rpc: ' + (j.error.message || j.error.code));
      return j?.result ?? null;
    } catch (e) { lastErr = String(e?.message || e); }
  }
  throw new Error(lastErr || 'rpc failed');
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const requestId = body.request_id ? String(body.request_id) : null;
    let qy = svc.from('solana_deposit_requests').select('*').eq('status', 'pending');
    if (requestId) qy = qy.eq('id', requestId);
    const { data: pending } = await qy.order('created_at', { ascending: false }).limit(100);
    if (!pending?.length) return json({ ok: true, completed: [], pendingCount: 0 });

    const oldestMs = Math.min(...pending.map((p: any) => new Date(p.created_at).getTime())) - 180000;
    let sigs: any;
    try { sigs = await rpc('getSignaturesForAddress', [ADMIN, { limit: 25 }]); }
    catch (e) { return json({ ok: false, reason: 'rpc: ' + String(e?.message || e) }); }
    const recent = (sigs || []).filter((s: any) => !s.err && (s.blockTime || 0) * 1000 >= oldestMs);

    const completed: any[] = [];
    for (const s of recent) {
      const { data: exists } = await svc.from('transactions').select('id').eq('reference', s.signature).limit(1);
      if (exists?.length) continue;
      let tx: any;
      try { tx = await rpc('getTransaction', [s.signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]); } catch { continue; }
      if (!tx || tx.meta?.err) continue;
      const findAmt = (arr: any[]) => { const e = (arr || []).find((b: any) => b.mint === USDC_MINT && b.owner === ADMIN); return e ? Number(String(e.uiTokenAmount?.amount || '0')) : 0; };
      const received = findAmt(tx.meta.postTokenBalances) - findAmt(tx.meta.preTokenBalances);
      if (received <= 0) continue;
      const match = pending.find((p: any) => Number(p.pay_units) === received);
      if (!match) continue;
      const { data: claimed } = await svc.rpc('claim_solana_pay', { p_request: match.id, p_signature: s.signature });
      if (!claimed) continue;
      const receivedUsd = Math.min(received / 1e6, 100000);
      const { error } = await svc.rpc('credit_solana_pay', { p_request: match.id, p_user: match.user_id,
        p_email: match.user_email || '', p_amount: receivedUsd, p_signature: s.signature });
      if (error) return json({ ok: false, reason: 'credit-failed: ' + error.message });
      completed.push({ request_id: match.id, amount: receivedUsd, signature: s.signature });
    }
    return json({ ok: true, completed, pendingCount: pending.length - completed.length });
  } catch (e) { return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) }); }
});
