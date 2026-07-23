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