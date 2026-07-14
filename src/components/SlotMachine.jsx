import React, { useState, useRef, useEffect } from "react";
import { RotateCw, Coins, Trophy, Volume2, VolumeX } from "lucide-react";

const SYMBOLS = [
  { id: "cowboy",  emoji: "🤠", label: "কাউবয়",  weight: 1, pay: 50 },
  { id: "bag",    emoji: "💰", label: "টাকার ব্যাগ", weight: 2, pay: 20 },
  { id: "target", emoji: "🎯", label: "টার্গেট",  weight: 3, pay: 15 },
  { id: "pistol", emoji: "🔫", label: "পিস্তল",  weight: 4, pay: 10 },
  { id: "cactus", emoji: "🌵", label: "ক্যাকটাস", weight: 5, pay: 5 },
  { id: "star",   emoji: "⭐", label: "স্টার",   weight: 5, pay: 5 },
];

const BETS = [10, 25, 50, 100];
const REEL_VISIBLE = 3;
const STORAGE_KEY = "slot_balance";

function pickWeighted() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

function buildReel() {
  return Array.from({ length: REEL_VISIBLE }, pickWeighted);
}

function calcWin(reels, bet) {
  const middle = reels.map(r => r[1]);
  const [a, b, c] = middle;
  if (a.id === b.id && b.id === c.id) {
    return { type: "triple", amount: a.pay * bet, symbols: [a, b, c] };
  }
  if (a.id === b.id || b.id === c.id || a.id === c.id) {
    return { type: "pair", amount: bet, symbols: middle };
  }
  return { type: "none", amount: 0, symbols: middle };
}

export default function SlotMachine() {
  const [reels, setReels] = useState([buildReel(), buildReel(), buildReel()]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved) : 1000;
  });
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState("স্পিন করতে বাটনে চাপুন!");
  const [muted, setMuted] = useState(false);
  const audioCtx = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(balance)); }, [balance]);

  const beep = (freq = 440, dur = 0.1, type = "sine") => {
    if (muted) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  };

  const spin = () => {
    if (spinning) return;
    if (balance < bet) { setMessage("পর্যাপ্ত ব্যালেন্স নেই! রিসেট করুন।"); return; }
    setSpinning(true);
    setLastWin(0);
    setBalance(b => b - bet);
    setMessage("স্পিন হচ্ছে...");
    beep(220, 0.15);

    const finalReels = [buildReel(), buildReel(), buildReel()];
    const spinDurations = [900, 1200, 1500];
    let done = 0;

    spinDurations.forEach((dur, i) => {
      const interval = setInterval(() => {
        setReels(prev => {
          const next = [...prev];
          next[i] = buildReel();
          return next;
        });
      }, 80);
      setTimeout(() => {
        clearInterval(interval);
        setReels(prev => {
          const next = [...prev];
          next[i] = finalReels[i];
          return next;
        });
        beep(330 + i * 110, 0.08, "square");
        done++;
        if (done === 3) settle(finalReels);
      }, dur);
    });
  };

  const settle = (finalReels) => {
    const win = calcWin(finalReels, bet);
    setSpinning(false);
    if (win.type === "triple") {
      setBalance(b => b + win.amount);
      setLastWin(win.amount);
      setMessage(`🎉 জ্যাকপট! ${win.amount} কয়েন জিতেছেন!`);
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 90));
    } else if (win.type === "pair") {
      setBalance(b => b + win.amount);
      setLastWin(win.amount);
      setMessage(`ম্যাচ! ${win.amount} কয়েন ফেরত পেয়েছেন`);
      beep(523, 0.12);
    } else {
      setMessage("আবার চেষ্টা করুন!");
      beep(180, 0.1, "sawtooth");
    }
  };

  const reset = () => { setBalance(1000); setLastWin(0); setMessage("ব্যালেন্স রিসেট হয়েছে (১০০০ কয়েন)"); };

  const payline = reels.map(r => r[1]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Balance bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/70 border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 font-bold tabular-nums">{balance}</span>
        </div>
        {lastWin > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="text-amber-200 font-bold tabular-nums">+{lastWin}</span>
          </div>
        )}
        <button onClick={() => setMuted(m => !m)} className="p-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-300 hover:text-white">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Reels */}
      <div className="relative rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-950 border-2 border-amber-600/40 p-4 shadow-2xl shadow-amber-900/30">
        {/* Payline indicator */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-20 border-y border-dashed border-amber-400/30 pointer-events-none" />
        <div className="grid grid-cols-3 gap-2">
          {reels.map((reel, ri) => (
            <div key={ri} className="flex flex-col gap-1 bg-slate-950/80 rounded-lg overflow-hidden py-1">
              {reel.map((sym, si) => (
                <div
                  key={si}
                  className={`h-20 flex items-center justify-center text-5xl transition-all ${
                    si === 1 ? "scale-110" : "opacity-50"
                  } ${spinning ? "blur-[1px]" : ""}`}
                >
                  {sym.emoji}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      <p className="text-center text-sm text-amber-200/90 mt-3 h-5">{message}</p>

      {/* Bet selector */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs text-slate-400">বাজি:</span>
        {BETS.map(b => (
          <button
            key={b}
            disabled={spinning}
            onClick={() => setBet(b)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
              bet === b ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Spin */}
      <button
        onClick={spin}
        disabled={spinning || balance < bet}
        className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <RotateCw className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
        {spinning ? "স্পিন..." : "স্পিন করুন"}
      </button>

      <button onClick={reset} className="w-full mt-2 py-2 rounded-lg bg-slate-800/60 text-slate-400 text-xs hover:bg-slate-700 hover:text-slate-200">
        ব্যালেন্স রিসেট করুন
      </button>

      {/* Paytable */}
      <div className="mt-4 rounded-lg bg-slate-900/50 border border-slate-800 p-3">
        <p className="text-xs text-slate-400 mb-2 font-semibold">জিতের তালিকা (৩টি ম্যাচ × বাজি)</p>
        <div className="grid grid-cols-3 gap-2">
          {SYMBOLS.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-amber-400 font-semibold">{s.pay}×</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">২টি ম্যাচ = বাজি ফেরত (১×) · 🤠 কাউবয় = জ্যাকপট (৫০×)</p>
      </div>
    </div>
  );
}