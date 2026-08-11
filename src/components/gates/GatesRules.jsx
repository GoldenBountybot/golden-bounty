import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { SYM_IMG } from './GatesSymbol';

// Gates of Olympus — game rules panel (how to play, separate from paytable).
// Matches the GatesInfoPanel visual style: dark purple gradient, gold border.
export default function GatesRules({ onClose }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-[10px] p-4 max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(to bottom,#1a0a38,#0a0518)', border: '2px solid rgba(200,140,10,0.6)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <h3 style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '16px', color: '#ffe080' }}>GAME RULES</h3>
          </div>
          <X className="w-5 h-5 text-amber-300/70 cursor-pointer" onClick={onClose} />
        </div>

        <div style={{ fontFamily: 'Georgia,serif', fontSize: '11px', color: '#c0a870', lineHeight: 1.7 }}>
          <section className="mb-3">
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>HOW TO PLAY</h4>
            <p>Gates of Olympus is a 6×5 pay-anywhere slot. Land 8 or more matching symbols anywhere on the grid in a single spin to win — no paylines needed.</p>
          </section>

          <section className="mb-3">
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>TUMBLE FEATURE</h4>
            <p>After every winning spin, winning symbols shatter and new symbols tumble down from above to fill the gaps. If the new symbols form another win, the tumble repeats — continuing until no more wins appear. All tumbles in one spin add up to your total win.</p>
          </section>

          <section className="mb-3">
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>MULTIPLIER SYMBOLS</h4>
            <div className="flex items-center gap-1.5 mb-1">
              <img src={SYM_IMG.mult} alt="green" style={{ height: 16, width: 'auto', mixBlendMode: 'screen' }} />
              <span>Green: ×1 – ×9</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <img src={SYM_IMG.mult_blue} alt="blue" style={{ height: 16, width: 'auto', mixBlendMode: 'screen' }} />
              <span>Blue: ×10 – ×50</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <img src={SYM_IMG.mult_pink} alt="pink" style={{ height: 16, width: 'auto', mixBlendMode: 'screen' }} />
              <span>Pink: ×51 – ×100</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={SYM_IMG.mult_red} alt="red" style={{ height: 16, width: 'auto', mixBlendMode: 'screen' }} />
              <span>Red: ×101 – ×500</span>
            </div>
            <p style={{ marginTop: 6 }}>In the base game, multiplier symbols that land are added to your win for that spin. During Free Spins, all multiplier symbols stick and their values sum up, applying to the total free spins win at the end.</p>
          </section>

          <section className="mb-3">
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>FREE SPINS</h4>
            <div className="flex items-center gap-1.5 mb-1">
              <img src={SYM_IMG.scatter} alt="scatter" style={{ height: 16, width: 'auto' }} />
              <span>4+ Scatters → 15 Free Spins</span>
            </div>
            <p>During Free Spins, every multiplier symbol that lands sticks on the grid and accumulates. At the end of the round, all accumulated multipliers apply to your total free spins winnings.</p>
          </section>

          <section className="mb-3">
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>BUY FREE SPINS</h4>
            <p>Tap the BUY FREE SPINS button to instantly enter the Free Spins round for 100× your current bet — no need to wait for 4 scatters.</p>
          </section>

          <section>
            <h4 style={{ color: '#ffe080', fontSize: '12px', fontWeight: 900, marginBottom: 4 }}>CONTROLS</h4>
            <p>Use − / + to adjust your bet, the spin button to spin, the circular arrows for auto-spin, and the menu icon to select a preset bet. Tap the info (i) icon to view the paytable.</p>
          </section>
        </div>
      </div>
    </div>
  );
}