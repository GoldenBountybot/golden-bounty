// Mirrors the live begin-round server logic: the admin's RTP % is multiplied
// by a per-game factor to get the real per-round win (hit) chance.
const HIT_FACTOR = {
  'hi-lo': 0.95,
  mines: 0.95,
  thimbles: 0.40,
  'wild-bounty': 0.31,
  'big-brown': 0.30,
  fullhouse: 0.24,
  'gates-of-olympus': 0.22,
  argonauts: 0.07,
};

export function hitRateLabel(gameId, rtp) {
  if (gameId === 'plinko') return 'Fixed bucket odds';
  const f = HIT_FACTOR[gameId] ?? 0.15;
  return `~${(Number(rtp ?? 50) * f).toFixed(1)}% win rate`;
}