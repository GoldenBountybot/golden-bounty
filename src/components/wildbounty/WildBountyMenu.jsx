import React from 'react';
import { X, Zap, Settings, Volume2, BarChart3, FileText, Trophy } from 'lucide-react';

const BG = '#2a272f';
const YELLOW = '#fec00f';
const WHITE = '#d1cfd4';

function MenuItem({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(254,192,15,0.1)' }}>
        {React.cloneElement(icon, { style: { color: YELLOW }, strokeWidth: 2.2, className: 'w-5 h-5' })}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: '#ffffff' }}>{title}</p>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: WHITE }}>{desc}</p>
      </div>
    </button>
  );
}

export default function WildBountyMenu({ open, onClose, onOpenPaytable, onOpenRules, onOpenHistory }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <X className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.4} />
        </button>
        <h2 className="font-black text-lg tracking-wide" style={{ color: YELLOW }}>Game Rules</h2>
        <div className="w-9" />
      </div>

      {/* Menu list */}
      <div className="flex-1 overflow-y-auto">
        <MenuItem
          icon={<Zap />}
          title="Turbo Spin"
          desc="Tap to enable or disable the Turbo Spin to reduce the duration of reel spins in the main game."
          onClick={onClose}
        />
        <MenuItem
          icon={<Settings />}
          title="More Settings"
          desc="Tap to access additional settings."
          onClick={onClose}
        />
        <MenuItem
          icon={<Volume2 />}
          title="Sound"
          desc="Tap to turn sound ON or OFF."
          onClick={onClose}
        />
        <MenuItem
          icon={<BarChart3 />}
          title="Paytable"
          desc="Shows winning combinations and paytable."
          onClick={() => { onClose(); onOpenPaytable(); }}
        />
        <MenuItem
          icon={<FileText />}
          title="Rules"
          desc="Shows the game rules and button functions."
          onClick={() => { onClose(); onOpenRules(); }}
        />
        <MenuItem
          icon={<Trophy />}
          title="History"
          desc="Shows details of the previous games played. Scroll down to the end to load more records."
          onClick={() => { onClose(); onOpenHistory(); }}
        />
        <MenuItem
          icon={<X />}
          title="Close"
          desc="Tap to return to the Main Game."
          onClick={onClose}
        />

        {/* Return to Player */}
        <div className="px-5 pt-6">
          <h3 className="text-center font-black text-[15px] mb-2" style={{ color: '#ffffff' }}>Return to Player</h3>
          <p className="text-[12px] leading-relaxed" style={{ color: WHITE }}>
            The theoretical return to player (RTP) for this game is 97.11%. This RTP represents the long-term statistical percentage of total stakes in the game that is paid out as winnings over time. The RTP value is calculated by dividing the total winnings by the total stakes from a simulation of numerous game rounds.
          </p>
        </div>

        <div className="px-5 pt-6 pb-10">
          <h3 className="text-center font-black text-[15px] mb-2" style={{ color: '#ffffff' }}>Additional Information</h3>
          <p className="text-[12px] leading-relaxed" style={{ color: WHITE }}>
            Malfunction voids all pays and plays.
          </p>
        </div>
      </div>
    </div>
  );
}