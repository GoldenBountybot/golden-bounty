import React from 'react';
import { PAYLINES } from './argonautsEngine';

// Argonauts Rules + Paylines + Attention info page — matches the reference:
// black background, gold headings, white body text, 10 numbered payline
// diagrams (two rows of five), and the attention disclaimer at the bottom.

const RULES = [
  'ARGONAUTS is a 5-reel 3-row slot game with 10 paylines.',
  'All prizes are for combinations of a kind.',
  'Matching symbols, except SCATTER symbols, should be on enabled paylines and adjacent reels, starting from the leftmost.',
  'SCATTER symbols count at any position on the reels.',
  'For the numbers of SCATTER symbols and combinations on each enabled payline, only the highest win is paid.',
  'SCATTER wins and line wins are added.',
  'All prizes in the paytable are shown for the currently selected bet and number of enabled paylines.',
  'All prizes in the paytable are shown in money (EUR).',
];

const WILD = [
  'Appears stacked both in the main game and Free Games. Depending on where the reel stops, you may see the whole reel full of STACKED WILD symbols or just the beginning or the end of the sequence.',
];

const FREE_GAMES = [
  '3 SCATTER symbols trigger 8 Free Games. Appear on reels 2, 3 & 4 only in the main game and in Free Games.',
  'During Free Games, only top-symbols, WILD, SCATTER and BONUS appear on the reels.',
  'Free Games are played with the same bet as the initial game and can be won again during the feature.',
];

const GOLDEN_FLEECE = [
  '6 or more BONUS symbols scattered on the reels trigger the GOLDEN FLEECE Bonus Game. BONUS symbols may appear stacked.',
  'Prizes shown on the BONUS symbols can be won during the Bonus Game only. The triggering BONUS symbols move to the relevant positions of the Bonus Game grid.',
  'During the Bonus Game the reels turn into a 5x3 grid with Jason\u2019s Shield BONUS symbols, Golden Fleece BONUS symbols and Round Greek MEANDER symbols on each position. BONUS symbols remain in place, while MEANDER symbols keep the reels spinning.',
  'Each Jason\u2019s Shield BONUS symbol shows a prize equal to your total bet multiplied by one of: X1, X2, X3, X4, X5, X6, X7, X8, X9, X10, X12, X14, X16.',
  'Each Golden Fleece BONUS symbol hides one of: MAX JACKPOT (150X), MID JACKPOT (50X), MIN JACKPOT (20X).',
  'Bonus Game starts with 3 attempts. Every reels\u2019 spin uses 1 attempt. New BONUS symbols revert attempts to 3. It continues until you run out of attempts or fill all 15 positions with BONUS symbols.',
  'Collecting 15 BONUS symbols awards an extra ULTRA JACKPOT of 5000X total bets!',
  'The Bonus Game is played with the same bet as the initial game and cannot be won again during the feature.',
];

const RISK_GAME = [
  'Choose a card from the four cards dealt face down. Beat the Dealer\u2019s card to double your winnings (up to 10 attempts). If the Dealer wins, you lose your winnings and the Risk Game ends.',
  'The Joker beats all other cards. The Dealer can never get a Joker. A draw (same value as the Dealer) keeps your winnings and lets you take another attempt.',
  'If you don\u2019t want to risk, press the TAKE WIN button to quit and collect your current winnings.',
  'Average return to player (RTP) for the Risk Game round is 84%.',
];

const ATTENTION = [
  'All unfinished games, untaken prizes, unused accumulated amounts are saved for 7 days and then canceled. Saved results can be canceled before the 7-day expiration period in case of a scheduled system update or server maintenance. Please make sure that you have collected all your wins and prizes before you quit the game.',
  'The English version shall always prevail in case of any discrepancies or inconsistencies between the English version and other language versions.',
];

function PaylineDiagram({ line, num }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: 'repeat(5, 9px)', gridTemplateRows: 'repeat(3, 9px)' }}
      >
        {Array.from({ length: 15 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const active = line[col] === row;
          return (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                background: active ? '#FFD700' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,215,0,0.25)',
                boxShadow: active ? '0 0 5px rgba(255,215,0,0.7)' : 'none',
              }}
            />
          );
        })}
      </div>
      <span className="text-[9px] font-bold text-white/70 mt-1" style={{ fontFamily: 'Georgia, serif' }}>{num}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3
        className="text-[13px] font-black tracking-[0.18em] mb-1.5"
        style={{ fontFamily: 'Georgia, serif', color: '#FFD700', textShadow: '0 1px 2px #000' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ArgoRules({ onClose }) {
  return (
    <div className="w-full">
      <h2
        className="text-center text-xl font-black mb-1 tracking-[0.2em]"
        style={{ fontFamily: 'Georgia, serif', color: '#FFD700', textShadow: '0 1px 2px #000' }}
      >
        ARGONAUTS
      </h2>
      <div className="mx-auto mb-3 h-[2px] w-2/3" style={{ background: 'linear-gradient(to right, transparent, #FFD700, transparent)' }} />

      <div className="max-h-[64vh] overflow-y-auto pr-1">
        <Section title="RULES">
          <ul className="space-y-1.5">
            {RULES.map((r, i) => (
              <li key={i} className="text-[11px] leading-snug text-white/90 flex gap-1.5" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="text-yellow-400 shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="PAYLINES">
          <div className="grid grid-cols-5 gap-2 py-1">
            {PAYLINES.map((line, i) => (
              <PaylineDiagram key={i} line={line} num={i + 1} />
            ))}
          </div>
        </Section>

        <Section title="STACKED WILD">
          {WILD.map((t, i) => (
            <p key={i} className="text-[11px] leading-snug text-white/90 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>{t}</p>
          ))}
        </Section>

        <Section title="FREE GAMES">
          {FREE_GAMES.map((t, i) => (
            <p key={i} className="text-[11px] leading-snug text-white/90 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>{t}</p>
          ))}
        </Section>

        <Section title="GOLDEN FLEECE BONUS">
          {GOLDEN_FLEECE.map((t, i) => (
            <p key={i} className="text-[11px] leading-snug text-white/90 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>{t}</p>
          ))}
        </Section>

        <Section title="RISK GAME (GAMBLE)">
          {RISK_GAME.map((t, i) => (
            <p key={i} className="text-[11px] leading-snug text-white/90 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>{t}</p>
          ))}
        </Section>

        <Section title="ATTENTION!">
          {ATTENTION.map((a, i) => (
            <p key={i} className="text-[11px] leading-snug text-white/90 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>
              {a}
            </p>
          ))}
        </Section>
      </div>

      <button
        onClick={onClose}
        className="mt-2 w-full py-2 rounded-[8px] font-black tracking-wider"
        style={{ border: '1px solid rgba(255,215,0,0.5)', background: 'rgba(0,0,0,0.6)', color: '#FFD700', fontFamily: 'Georgia, serif' }}
      >
        CLOSE
      </button>
    </div>
  );
}