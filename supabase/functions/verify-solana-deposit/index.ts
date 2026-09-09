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
async function alreadyCredited(reference: string) {
  const { data } = await svc.from('transactions').select('amount').eq('reference', reference).limit(1);
  return data?.length ? Number(data[0].amount) : null;
}
async function credit(userId: string, amount: number, method: string, reference: string, note: string) {
  const { data: p } = await svc.from('profiles').select('email').eq('id', userId).maybeSingle();
  const { data, error } = await svc.rpc('credit_deposit', { p_user: userId, p_email: p?.email || '',
    p_amount: amount, p_method: method, p_reference: reference, p_note: note });
  if (error) throw new Error(error.message);
  return data;
}

const SOLANA_RPC = 'https://solana-rpc.publicnode.com';
const ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
async function rpc(m: string, p: any[]) {
  const r = await fetch(SOLANA_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: m, params: p }) });
  return (await r.json())?.result ?? null;
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const signature = String(body.signature || '');
    const amount = Number(body.amount);
    const userWallet = String(body.userWallet || '');
    const expectedLamports = Number(body.expectedLamports);
    if (!signature || !isFinite(amount) || amount <= 0 || !userWallet || !expectedLamports) return json({ ok: false, reason: 'invalid-params' });
    const prev = await alreadyCredited(signature);
    if (prev !== null) return json({ ok: true, already: true, amount: prev });
    const tx = await rpc('getTransaction', [signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
    if (!tx) return json({ ok: false, reason: 'pending' });
    if (tx.meta?.err) return json({ ok: false, reason: 'tx-failed' });
    const keys = (tx.transaction.message.accountKeys || []).map((a: any) => (typeof a === 'string' ? a : a.pubkey));
    if (keys[0] !== userWallet) return json({ ok: false, reason: 'sender-mismatch' });
    const idx = keys.indexOf(ADMIN);
    if (idx < 0) return json({ ok: false, reason: 'recipient-not-found' });
    const received = (tx.meta.postBalances[idx] || 0) - (tx.meta.preBalances[idx] || 0);
    if (received < expectedLamports * 0.99) return json({ ok: false, reason: 'amount-mismatch' });
    const c = await credit(user.id, amount, 'wallet-phantom-solana', signature, 'Phantom · Solana (SOL)');
    return json({ ok: true, amount, already: !!c?.already, balance: c?.balance });
  } catch (e) { return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) }); }
});
