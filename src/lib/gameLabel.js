// Human-readable label for a logged round's game_id.
// Our own games are logged by slug; provider rounds are logged as
// "<provider>:<provider game code>".
import { ENDORPHINA_GAMES } from '@/lib/endorphinaGames';
import { JILI_GAMES } from '@/lib/jiliGames';

const OWN_GAMES = {
  'wild-bounty': 'Wild Bounty',
  'hi-lo': 'High or Low',
  'plinko': 'Plinko',
  'mines': 'Mines',
  'fullhouse': 'Super ACE',
  'rocket-crash': 'Rocket Crash',
  'crown-coins': 'Crown Coins',
  'big-brown': 'Big Brown',
  'gates-of-olympus': 'Gates of Olympus',
  'thimbles': 'Thimbles',
  'free-spin': 'Lucky Wheel',
};

export function gameLabel(gameId = '') {
  if (OWN_GAMES[gameId]) return OWN_GAMES[gameId];

  if (gameId.startsWith('endorphina:')) {
    const code = gameId.slice('endorphina:'.length);
    const hit = ENDORPHINA_GAMES.find((g) => g.code === code);
    if (hit) return hit.name;
    // Fall back to prettifying the provider code, e.g.
    // "endorphina2_BurningCoins100@ENDORPHINA" → "Burning Coins 100".
    const raw = code.replace(/@.*$/, '').replace(/^endorphina2?_/, '');
    return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Za-z])(\d)/g, '$1 $2').trim() || 'Endorphina';
  }

  if (gameId.startsWith('jili:')) {
    const code = gameId.slice('jili:'.length);
    return JILI_GAMES.find((g) => String(g.id) === code)?.name || 'JILI';
  }

  return gameId || '?';
}