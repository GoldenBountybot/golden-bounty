// Amount + game pools for the home Live Ticker.
// PG SOFT and JILI have different bet steps, so their win / loss amounts are
// generated separately to look realistic.
import { PG_GAMES } from '@/lib/pgGames';
import { JILI_GAMES } from '@/lib/jiliGames';

export const IN_HOUSE_GAMES = ['Wild Bounty', 'Gates of Olympus', 'Plinko', 'Mines', 'Crown Coins', 'Big Brown', 'Argonauts', 'Super ACE'];
export const PG_NAMES = PG_GAMES.map(g => g.title);
export const JILI_NAMES = JILI_GAMES.map(g => g.name);

const rand = (min, max) => Math.random() * (max - min) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const step = (v, s) => (Math.round(v / s) * s).toFixed(2);

// JILI losses move in $0.05 steps starting at $0.05 (0.05, 0.10, 0.15 …).
// Small losses dominate, bigger ones show up less often.
export function jiliLoss() {
  const r = Math.random();
  if (r < 0.62) return step(rand(0.05, 1), 0.05);
  if (r < 0.88) return step(rand(1, 10), 0.05);
  if (r < 0.98) return step(rand(10, 60), 0.05);
  return step(rand(60, 250), 0.05);
}

// JILI wins: $0.01 → $2000, heavily weighted to $0.01–$5.
export function jiliWin() {
  const r = Math.random();
  if (r < 0.78) return rand(0.01, 5).toFixed(2);
  if (r < 0.92) return rand(5, 25).toFixed(2);
  if (r < 0.98) return rand(25, 200).toFixed(2);
  return rand(200, 2000).toFixed(2);
}

// PG bets start at $0.20, so losses step in $0.10 from $0.20 upward, with
// bigger losses appearing less often.
export function pgLoss() {
  const r = Math.random();
  if (r < 0.58) return step(rand(0.2, 2), 0.1);
  if (r < 0.86) return step(rand(2, 20), 0.1);
  if (r < 0.97) return step(rand(20, 100), 0.1);
  return step(rand(100, 400), 0.1);
}

// PG wins: $0.02 → $5000, mostly between $0.02 and $20.
export function pgWin() {
  const r = Math.random();
  if (r < 0.78) return rand(0.02, 20).toFixed(2);
  if (r < 0.92) return rand(20, 120).toFixed(2);
  if (r < 0.98) return rand(120, 800).toFixed(2);
  return rand(800, 5000).toFixed(2);
}