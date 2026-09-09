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
async function profile(id: string) {
  const { data } = await svc.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
}
async function wallet(id: string) {
  const { data } = await svc.rpc('wallet_get', { p_user: id });
  return Array.isArray(data) ? data[0] : data;
}

const WAIT_MS = 5000, CRASH_HOLD_MS = 1500, GROWTH = 1.10;
function genCrashPoint(rtp: number) {
  const rand = () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; };
  const rtpBand = 3 + rand() * 6;
  const rtpJitter = rtp + (rand() - 0.5) * 2 * rtpBand;
  const r1 = 0.03 + rand() * 0.08;
  const r2 = r1 + 0.18 + rand() * 0.20;
  const regime = rand();
  let crash: number;
  if (regime < r1) { const exp = 1.3 + rand() * 0.8; crash = (rtpJitter / 100) / Math.pow(1 - rand(), exp); }
  else if (regime < r2) { const k = 1 + rand() * 2; crash = (rtpJitter / 100) / (1 - Math.pow(rand(), k)); }
  else { const exp = 0.9 + rand() * 0.4; crash = (rtpJitter / 100) / Math.pow(1 - rand(), exp); }
  const noiseAmp = 0.10 + rand() * 0.45;
  crash *= 1 + (rand() - 0.5) * noiseAmp * 2;
  if (rand() < 0.08 + rand() * 0.10) crash *= 0.25 + rand() * 3;
  if (crash > 10 && crash <= 50 && rand() < 0.15 + rand() * 0.10) crash = 2 + rand() * 8;
  const capHi = 50 + rand() * 25;
  if (crash > capHi && rand() < 0.70) crash = 10 + rand() * 40;
  if (crash > 100 && rand() < 0.92) crash = 20 + rand() * 80;
  if (crash < 1.00) crash = 1.00 + rand();
  return Math.min(Math.max(crash, 1.00), 250);
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const now = Date.now();
    let { data: rows } = await svc.from('crash_rounds').select('*').eq('current', true).order('updated_at', { ascending: false }).limit(1);
    let round: any = rows?.[0];
    if (!round) {
      const { data: created } = await svc.from('crash_rounds').insert({
        current: true, round_id: 1, phase: 'waiting', crash_point: genCrashPoint(97),
        wait_start: now, run_start: 0, crash_at: 0, final_multiplier: 1, history: [] }).select('*').single();
      round = created;
    }
    let patch: any = null;
    if (round.phase === 'waiting') {
      if (now - Number(round.wait_start) >= WAIT_MS) patch = { phase: 'running', run_start: now };
    } else if (round.phase === 'running') {
      const m = Math.pow(GROWTH, (now - Number(round.run_start)) / 1000);
      if (m >= Number(round.crash_point)) {
        const hist = (round.history || []).slice(0, 21);
        hist.unshift(Number(round.crash_point));
        patch = { phase: 'crashed', crash_at: now, final_multiplier: Number(round.crash_point), history: hist };
      }
    } else if (round.phase === 'crashed') {
      if (now - Number(round.crash_at) >= CRASH_HOLD_MS) {
        let rtp = 97;
        const { data: gs } = await svc.from('game_settings').select('rtp').eq('game_id', 'rocket-crash').limit(1);
        if (gs?.[0]?.rtp) rtp = Number(gs[0].rtp);
        patch = { round_id: (Number(round.round_id) || 1) + 1, phase: 'waiting', crash_point: genCrashPoint(rtp),
          wait_start: now, run_start: 0, crash_at: 0, final_multiplier: 1 };
      }
    }
    if (patch) {
      const { data: upd } = await svc.from('crash_rounds').update(patch).eq('id', round.id).eq('phase', round.phase).select('*');
      if (upd?.length) round = upd[0];
      else {
        const { data: fresh } = await svc.from('crash_rounds').select('*').eq('id', round.id).single();
        round = fresh;
      }
    }
    return json({ round_id: Number(round.round_id), phase: round.phase, crash_point: Number(round.crash_point),
      wait_start: Number(round.wait_start), run_start: Number(round.run_start), crash_at: Number(round.crash_at),
      final_multiplier: Number(round.final_multiplier), history: round.history || [], now });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
