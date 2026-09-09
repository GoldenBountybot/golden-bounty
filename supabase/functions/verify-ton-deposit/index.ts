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
import { Address } from 'https://esm.sh/@ton/core@0.60.1';
const ADMIN_TON = 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6';
const toRaw = (a: string) => { try { return '0:' + Address.parse(a).hash.toString('hex'); } catch { return ''; } };
async function getJson(url: string) { const r = await fetch(url); if (!r.ok) return null; return await r.json(); }

const USDT_MASTER_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const userWalletRaw = toRaw(body.userWallet);
    if (!userWalletRaw || !isFinite(amount) || amount <= 0) return json({ ok: false, reason: 'invalid-params' });
    const adminRaw = toRaw(ADMIN_TON);
    const expected = BigInt(Math.round(amount * 1e6)).toString();
    const adminJettons = await getJson(`https://tonapi.io/v2/accounts/${ADMIN_TON}/jettons`);
    const adminJettonWallet = (adminJettons?.balances || []).find((b: any) => b.jetton?.address === USDT_MASTER_RAW)?.wallet_address?.address;
    if (!adminJettonWallet) return json({ ok: false, reason: 'admin-wallet-not-found' });
    for (let i = 0; i < 6; i++) {
      const ev = await getJson(`https://tonapi.io/v2/accounts/${adminJettonWallet}/events?limit=20`);
      for (const e of (ev?.events || [])) {
        for (const a of (e.actions || [])) {
          if (a.type !== 'JettonTransfer') continue;
          const j = a.JettonTransfer;
          if (!j) continue;
          if (j.sender?.address !== userWalletRaw) continue;
          if (j.recipient?.address !== adminRaw) continue;
          if (j.jetton?.address !== USDT_MASTER_RAW) continue;
          if (j.amount !== expected) continue;
          const prev = await alreadyCredited(e.event_id);
          if (prev !== null) return json({ ok: true, already: true, amount: prev });
          const c = await credit(user.id, amount, 'wallet-tonkeeper', e.event_id, 'Tonkeeper · USDT TON');
          return json({ ok: true, amount, already: !!c?.already, balance: c?.balance });
        }
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    return json({ ok: false, reason: 'pending' });
  } catch (e) { return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) }); }
});
