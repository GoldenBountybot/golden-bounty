import React, { useState } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";
import BackButton from "@/components/BackButton";
import ShareButton from "@/components/ShareButton";
import GameTitleBar from "@/components/GameTitleBar";
import { useCasinoBalance } from "@/lib/useCasinoBalance";
import { Wallet } from "lucide-react";

// Desert landscape background with a green felt table foreground.
function DesertBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* desert sky + dunes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #d98a3c 0%, #e8a85a 22%, #c97a35 46%, #8a5a2a 60%, #5a3a1a 70%)',
        }}
      />
      {/* distant mountains */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '32%',
          height: '16%',
          background: 'linear-gradient(to bottom, #6b4a2a, #4a321a)',
          clipPath: 'polygon(0 60%, 8% 30%, 18% 55%, 28% 20%, 40% 50%, 52% 25%, 64% 55%, 76% 30%, 88% 50%, 100% 35%, 100% 100%, 0 100%)',
          opacity: 0.7,
        }}
      />
      {/* sun glow */}
      <div
        className="absolute rounded-full"
        style={{ top: '12%', right: '14%', width: 70, height: 70, background: 'radial-gradient(circle, rgba(255,240,200,0.9), rgba(255,210,140,0.3) 60%, transparent 70%)' }}
      />
      {/* green felt table foreground */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: '62%',
          background: 'radial-gradient(ellipse at 50% 0%, #2a7a4a 0%, #1A5E3A 40%, #13452a 100%)',
          boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.45)',
        }}
      />
      {/* felt texture noise */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: '62%',
          opacity: 0.18,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {/* scattered dollar bills + bullet casings on the felt */}
      {[
        { left: '8%', bottom: '14%', rot: -14, w: 46 },
        { left: '78%', bottom: '10%', rot: 22, w: 38 },
        { left: '20%', bottom: '6%', rot: 8, w: 34 },
        { left: '66%', bottom: '18%', rot: -10, w: 42 },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: b.left,
            bottom: b.bottom,
            width: b.w,
            height: b.w * 0.46,
            transform: `rotate(${b.rot}deg)`,
            background: 'linear-gradient(135deg, #2f6b43, #1f4a30)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
            opacity: 0.85,
          }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-emerald-200/70">$</span>
        </div>
      ))}
      {[
        { left: '30%', bottom: '8%' },
        { left: '58%', bottom: '14%' },
        { left: '88%', bottom: '6%' },
        { left: '14%', bottom: '20%' },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: c.left,
            bottom: c.bottom,
            width: 14,
            height: 5,
            background: 'linear-gradient(to right, #b8860b, #E6D080 50%, #b8860b)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);
  const { balance } = useCasinoBalance();

  return (
    <div className="relative min-h-screen">
      <DesertBackdrop />
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}
      <header className="sticky top-0 z-20 bg-stone-950/85 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Wild Bounty Showdown"
          icon={<img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg" alt="Wild Bounty" className="w-8 h-8 rounded-lg object-cover shrink-0" style={{ border: '1px solid rgba(214,178,98,0.6)' }} />}
          left={<BackButton />}
          right={
            <>
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
              >
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-black tabular-nums text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              <ShareButton />
            </>
          }
          maxWidth="max-w-4xl"
        />
      </header>

      <main className="max-w-4xl mx-auto px-1 py-2">
        <WildBountyMachine />
      </main>
    </div>
  );
}