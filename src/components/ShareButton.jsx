import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

// Copies the current game URL (or uses native share sheet) so anyone can open/clone the game link.
export default function ShareButton({ className = '' }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title || 'Golden Bounty Casino', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // user cancelled native share — ignore
    }
  };

  return (
    <button
      onClick={share}
      title="Share this game"
      className={`flex items-center gap-1 px-1 py-0.5 rounded-lg text-[8px] font-bold italic border transition-colors whitespace-nowrap ${
        copied ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'
      } ${className}`}
      style={{ fontFamily: 'Rye, Georgia, serif' }}
    >
      {copied ? <Check className="w-[5px] h-[5px]" /> : <Share2 className="w-[5px] h-[5px]" />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}