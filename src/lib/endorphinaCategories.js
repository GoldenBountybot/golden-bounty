// Maps an Endorphina title onto one of the lobby categories.
// Endorphina's catalogue is slot-heavy, so anything unmatched stays in Slots.

// Titles that clearly belong somewhere other than Slots, matched by name.
const CARDS = [/joker stoker/i, /4 of a king/i, /\bin jazz\b/i, /satoshi/i];
const BINGO = [/power balls/i, /\bkeno\b/i];
const ARCADE = [
  /football/i, /cricket/i, /sumo/i, /gem blast/i, /fresh crush/i, /puzzle/i,
  /cows & ufos/i, /panda strike/i, /cash tank/i, /sloth game/i, /gambleman/i,
  /dynamite miner/i, /twerk/i, /slotomoji/i, /love show/i, /cockroach fortune/i,
];
// Dice / roulette-style titles are table games.
const TABLE = [/\bdice\b/i, /fruletta/i, /chance machine/i, /\broulette\b/i];

const matches = (list, name) => list.some((re) => re.test(name));

export function endorphinaCategory(name = '') {
  if (matches(TABLE, name)) return 'Table';
  if (matches(BINGO, name)) return 'Bingo';
  if (matches(CARDS, name)) return 'Cards';
  if (matches(ARCADE, name)) return 'Arcade';
  return 'Slots';
}

// The catalogue is ordered newest-first, so the leading titles double as the
// provider's Popular picks.
export const ENDORPHINA_POPULAR_COUNT = 20;