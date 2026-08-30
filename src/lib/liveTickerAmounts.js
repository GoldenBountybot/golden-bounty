// Amount + game pools for the home Live Ticker.
// PG SOFT and JILI have different bet steps, so their win / loss amounts are
// generated separately to look realistic.
import { PG_GAMES } from '@/lib/pgGames';
import { JILI_GAMES } from '@/lib/jiliGames';

export const IN_HOUSE_GAMES = ['Wild Bounty', 'Gates of Olympus', 'Plinko', 'Mines', 'Crown Coins', 'Big Brown', 'Argonauts', 'Super ACE'];

// PG_GAMES is already sorted popular-first, so the head of the list is the
// popular pool.
// Our own Rocket Crash game (and any crash-style title) is never mentioned
// in the ticker.
const isCrash = (t) => /crash/i.test(t || '');
const PG_ALL = PG_GAMES.map(g => g.title).filter(t => !isCrash(t));
const PG_POPULAR = PG_ALL.slice(0, 24);

// JILI's best known titles (categories 2 = Popular in the catalogue).
const JILI_ALL = JILI_GAMES.map(g => g.name).filter(t => !isCrash(t));
const JILI_POPULAR = JILI_GAMES.filter(g => g.cat === 2).map(g => g.name).filter(t => !isCrash(t));

const rand = (min, max) => Math.random() * (max - min) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const step = (v, s) => (Math.round(v / s) * s).toFixed(2);

// Popular titles show up most of the time; the rest of the catalogue rarely.
export const pickPgGame = () => (Math.random() < 0.85 ? pick(PG_POPULAR) : pick(PG_ALL));
export const pickJiliGame = () => (Math.random() < 0.85 && JILI_POPULAR.length ? pick(JILI_POPULAR) : pick(JILI_ALL));

// JILI losses move in $0.05 steps starting at $0.05 (0.05, 0.10, 0.15 …).
// Small losses dominate, bigger ones show up less often.
export function jiliLoss() {
  const r = Math.random();
  if (r < 0.82) return step(rand(0.05, 2), 0.05);
  if (r < 0.94) return step(rand(2, 10), 0.05);
  if (r < 0.99) return step(rand(10, 60), 0.05);
  return step(rand(60, 250), 0.05);
}

// JILI wins: $0.01 → $2000, heavily weighted to $0.01–$5.
// Anything above $50 is very rare.
export function jiliWin() {
  const r = Math.random();
  if (r < 0.82) return rand(0.01, 2).toFixed(2);
  if (r < 0.95) return rand(2, 5).toFixed(2);
  if (r < 0.99) return rand(5, 20).toFixed(2);
  if (r < 0.9975) return rand(20, 50).toFixed(2);
  if (r < 0.9998) return rand(50, 200).toFixed(2);
  return rand(200, 600).toFixed(2);
}

// PG bets start at $0.20, so losses step in $0.10 from $0.20 upward, with
// bigger losses appearing less often.
export function pgLoss() {
  const r = Math.random();
  if (r < 0.6) return step(rand(0.2, 0.9), 0.1);   // 0.20 / 0.30 / 0.40 …
  if (r < 0.85) return step(rand(0.9, 2), 0.1);
  if (r < 0.95) return step(rand(2, 20), 0.1);
  if (r < 0.985) return step(rand(20, 100), 0.1);
  return step(rand(100, 400), 0.1);
}

// PG wins: $0.02 → $5000, mostly between $0.02 and $20.
// Anything above $50 is very rare.
export function pgWin() {
  const r = Math.random();
  if (r < 0.82) return rand(0.02, 2).toFixed(2);
  if (r < 0.94) return rand(2, 20).toFixed(2);
  if (r < 0.9975) return rand(20, 50).toFixed(2);
  if (r < 0.9998) return rand(50, 300).toFixed(2);
  return rand(300, 1000).toFixed(2);
}