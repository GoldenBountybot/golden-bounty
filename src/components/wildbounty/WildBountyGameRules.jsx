import React from 'react';
import { X, ChevronLeft } from 'lucide-react';

const BG = '#2b2a33';
const YELLOW = '#ffcc00';
const WHITE = '#e0e0e0';

function Bullet({ children }) {
  return (
    <li className="flex gap-2.5 items-start py-1.5">
      <span className="mt-[7px] w-1.5 h-1.5 shrink-0" style={{ background: WHITE }} />
      <span className="text-[13px] leading-relaxed" style={{ color: WHITE }}>{children}</span>
    </li>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <h3 className="text-center font-black text-[15px] mb-2 tracking-wide" style={{ color: '#ffffff' }}>
        {title}
      </h3>
      <ul>{children}</ul>
    </div>
  );
}

export default function WildBountyGameRules({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85] flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.4} />
        </button>
        <h2 className="font-black text-lg tracking-wide" style={{ color: YELLOW }}>Game Rules</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <X className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.4} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-12">
        <Section title="Main Game">
          <Bullet>6-reel video slot. Reels 1 &amp; 6 have 3 rows, reels 2 &amp; 5 have 4 rows, and reels 3 &amp; 4 have 5 rows — forming a 3-4-5-5-4-3 diamond layout with 3,600 ways to win.</Bullet>
          <Bullet>Bet ways win if the winning symbols are in succession from the leftmost reel to the right.</Bullet>
          <Bullet>Total number of winning bet ways for each symbol are calculated by multiplying the number of adjacent winning symbols on each reel from the leftmost reel to the right.</Bullet>
          <Bullet>The winning symbol payout is multiplied by the number of winning bet ways.</Bullet>
          <Bullet>After the payout of every round is made, all winning symbols will explode allowing the symbols above them to cascade down for a new round.</Bullet>
          <Bullet>Additional winning combination will be tallied in every round until no more winning combination can be tallied.</Bullet>
          <Bullet>All wins shown in cash.</Bullet>
          <Bullet>Wild symbol substitutes for all symbols except Scatter symbol.</Bullet>
          <Bullet>Free Spins Feature is played at the same bet size and bet level as the spin that triggered the Free Spins Feature.</Bullet>
        </Section>

        <Section title="Gold Framed Symbols">
          <Bullet>During any spin, some symbols (excluding Wild symbol and Scatter symbol) in reels 3 and/or 4 may appear as gold framed symbols.</Bullet>
          <Bullet>At every new round after the new symbols have cascaded down, any gold framed symbol(s) that is involved in a win in the previous round will be transformed into Wild symbol(s).</Bullet>
          <Bullet>Gold Framed symbols appear on reels 3 and 4 only.</Bullet>
        </Section>

        <Section title="Multiplier">
          <Bullet>At the start of any main game spin, the win multiplier is ×1.</Bullet>
          <Bullet>During any spin, if there are one or more winning symbols on the reels, after wins are paid and the new symbols have cascaded down, the win multiplier will be doubled.</Bullet>
          <Bullet>The maximum win multiplier is ×1,024.</Bullet>
        </Section>

        <Section title="Free Spins Feature">
          <Bullet>3 Scatter symbols appearing anywhere will trigger the Free Spins Feature with 10 free spins. Each additional Scatter symbol will trigger 2 more free spins.</Bullet>
          <Bullet>At the start of every free spin, the win multiplier is ×8.</Bullet>
          <Bullet>During any free spin, if there are one or more winning symbols on the reels, after wins are paid and the new symbols have cascaded down, the win multiplier will be doubled.</Bullet>
          <Bullet>Free spins can be retriggered.</Bullet>
        </Section>

        <Section title="Maximum Win">
          <Bullet>The maximum win amount is 5,000× of the bet amount.</Bullet>
          <Bullet>If the total win in the main game or the Free Spins Feature reaches 5,000× of the bet amount, the spin ends.</Bullet>
        </Section>

        <Section title="Feature Buy">
          <Bullet>Tap on Feature Buy button to open the Feature Buy menu.</Bullet>
          <Bullet>Tap on Start button to buy the Free Spins Feature at the price displayed in the Feature Buy menu.</Bullet>
        </Section>

        <Section title="Main Game Controls">
          <Bullet><b style={{ color: YELLOW }}>Spin</b> — Tap to start spin at the current Base Bet, Bet Size and Bet Level. Tap the button or the game area during a spin to stop the reels.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Auto Spin</b> — Auto Spin automatically plays the game for a selected number of spins. Tap on the values to select number of Auto Spins.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Turbo Spin</b> — Tap to enable or disable the Turbo Spin to reduce the duration of reel spins in the main game.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Minus / Plus</b> — Tap to reduce or increase the Bet Amount.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Bet Amount</b> — Tap to display the Bet Options. Scroll to select the Bet Size, Bet Level and Bet Amount. Max Bet sets both to maximum value.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Win Amount</b> — Tap to display the Game History.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Wallet Balance</b> — Tap to display the balance of available wallets.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Sound</b> — Tap to turn sound ON or OFF.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Paytable</b> — Shows winning combinations and paytable.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>Rules</b> — Shows the game rules and button functions.</Bullet>
          <Bullet><b style={{ color: YELLOW }}>History</b> — Shows details of the previous games played. Scroll down to the end to load more records. Tap the calendar icon to select the dates of games to be shown in History.</Bullet>
        </Section>

        <Section title="PC Version">
          <Bullet>Press the &lt;Space&gt; key to start spin at the current Base Bet, Bet Size and Bet Level.</Bullet>
          <Bullet>Press and hold &lt;Space&gt; key to continue game spins until it is released.</Bullet>
          <Bullet>When the reels are spinning, press the &lt;Space&gt; key to skip the reels spinning animation and reveal the reel results.</Bullet>
          <Bullet>Whenever there is exactly one on-screen button available to press, press the &lt;Space&gt; key to activate the button.</Bullet>
        </Section>

        <Section title="Return to Player">
          <Bullet>The theoretical return to player (RTP) for this game is 97.11%. This RTP represents the long-term statistical percentage of total stakes in the game that is paid out as winnings over time. The RTP value is calculated by dividing the total winnings by the total stakes from a simulation of numerous game rounds.</Bullet>
        </Section>

        <Section title="Additional Information">
          <Bullet>Malfunction voids all pays and plays.</Bullet>
        </Section>
      </div>
    </div>
  );
}