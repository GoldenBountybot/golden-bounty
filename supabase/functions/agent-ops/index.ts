const SB_URL = Deno.env.get('SUPABASE_URL');
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MIN_WITHDRAW = 5;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + jwt } });
  if (!r.ok) return null;
  return await r.json();
}
async function sel(path) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
async function patch(path, body) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
async function ins(path, body) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
}
async function rpc(name, args) {
  const r = await fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
const label = (p) => p?.username || p?.telegram_username || (p?.email || '').split('@')[0] || 'player';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const rows = await sel('profiles?id=eq.' + user.id + '&select=id,role,username,telegram_username,email,uid');
    const me = rows[0];
    if (!me) return json({ error: 'no-profile' }, 400);
    const isAdmin = me.role === 'admin';
    const isAgent = me.role === 'agent';
    const wallets = await sel('wallets?user_id=eq.' + user.id + '&select=balance,wager_remaining');
    const myBalance = Number(wallets[0]?.balance ?? 0);
    if (action === 'me') {
      return json({ role: me.role, username: label(me), uid: me.uid || '', balance: myBalance, min_withdraw: MIN_WITHDRAW });
    }
    if (action === 'agents') {
      const list = await sel('profiles?role=in.(agent,admin)&select=id,username,telegram_username,email,uid,full_name,avatar_url,photo_url&order=created_at.desc&limit=100');
      return json({
        agents: list.map((p) => ({
          id: p.id,
          username: label(p),
          uid: p.uid || '',
          full_name: p.full_name || '',
          avatar_url: p.avatar_url || p.photo_url || ''
        }))
      });
    }
    if (action === 'lookup') {
      if (!isAdmin && !isAgent) return json({ error: 'forbidden' }, 403);
      const found = await rpc('find_profile_ident', { p_q: String(body.q || '') });
      const f = found?.[0];
      if (!f) return json({ error: 'user-not-found' }, 404);
      const prof = (await sel('profiles?id=eq.' + f.id + '&select=id,username,telegram_username,email,uid,full_name,avatar_url,photo_url'))?.[0] || {};
      return json({ user: { id: f.id, username: f.username || label(prof), uid: f.uid || prof.uid || '', role: f.role, full_name: prof.full_name || '', avatar_url: prof.avatar_url || prof.photo_url || '' } });
    }
    if (action === 'set_role') {
      if (!isAdmin) return json({ error: 'forbidden' }, 403);
      const role = body.role === 'agent' ? 'agent' : 'user';
      const found = await rpc('find_profile_ident', { p_q: String(body.q || '') });
      const f = found?.[0];
      if (!f) return json({ error: 'user-not-found' }, 404);
      if (f.role === 'admin') return json({ error: 'cannot-change-admin' }, 400);
      await patch('profiles?id=eq.' + f.id, { role });
      return json({ ok: true, user: { id: f.id, username: f.username, uid: f.uid, role } });
    }
    if (action === 'transfer') {
      if (!isAdmin && !isAgent) return json({ error: 'forbidden' }, 403);
      const amount = Math.round(Number(body.amount || 0) * 100) / 100;
      if (!isFinite(amount) || amount <= 0) return json({ error: 'invalid-amount' }, 400);
      const found = await rpc('find_profile_ident', { p_q: String(body.q || '') });
      const f = found?.[0];
      if (!f) return json({ error: 'user-not-found' }, 404);
      const res = await rpc('agent_transfer_secure', { p_from: user.id, p_to: f.id, p_amount: amount, p_kind: 'deposit' });
      if (!res?.ok) return json(res, 400);
      try {
        await ins('user_notifications', {
          user_id: f.id,
          type: 'deposit_approved',
          title: 'Balance Received',
          body: '$' + amount.toFixed(2) + ' from agent ' + label(me),
          amount,
          link: '/dashboard?tab=wallet'
        });
      } catch (_e) { /* transfer already completed */ }
      return json({ ok: true, to: { username: f.username, uid: f.uid }, amount, balance: res.from_balance });
    }
    if (action === 'withdraw') {
      const amount = Math.round(Number(body.amount || 0) * 100) / 100;
      if (!isFinite(amount) || amount <= 0) return json({ error: 'invalid-amount' }, 400);
      if (amount < MIN_WITHDRAW) return json({ error: 'below-minimum', min: MIN_WITHDRAW }, 400);
      const found = await rpc('find_profile_ident', { p_q: String(body.q || '') });
      const f = found?.[0];
      if (!f) return json({ error: 'agent-not-found' }, 404);
      if (f.role !== 'agent' && f.role !== 'admin') return json({ error: 'not-an-agent' }, 400);
      const res = await rpc('agent_transfer_secure', { p_from: user.id, p_to: f.id, p_amount: amount, p_kind: 'withdraw' });
      if (!res?.ok) return json(res, 400);
      try {
        await ins('user_notifications', {
          user_id: f.id,
          type: 'withdraw_requested',
          title: 'New Withdrawal Received',
          body: '$' + amount.toFixed(2) + ' from ' + label(me) + (me.uid ? ' (ID ' + me.uid + ')' : ''),
          amount,
          link: '/agent'
        });
      } catch (_e) { /* transfer already completed */ }
      return json({ ok: true, agent: { username: f.username, uid: f.uid }, amount, balance: res.from_balance });
    }
    if (action === 'history') {
      const list = await sel('agent_transfers?or=(from_user.eq.' + user.id + ',to_user.eq.' + user.id + ')&select=*&order=created_at.desc&limit=30');
      const ids = [...new Set(list.flatMap((r) => [r.from_user, r.to_user]))];
      const people = ids.length ? await sel('profiles?id=in.(' + ids.join(',') + ')&select=id,username,telegram_username,email,uid') : [];
      const map = {};
      for (const p of people) map[p.id] = label(p);
      return json({
        history: list.map((r) => ({
          id: r.id,
          amount: Number(r.amount),
          kind: r.kind,
          created_at: r.created_at,
          direction: r.from_user === user.id ? 'out' : 'in',
          counterparty: map[r.from_user === user.id ? r.to_user : r.from_user] || 'player'
        }))
      });
    }
    return json({ error: 'unknown-action' }, 400);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
