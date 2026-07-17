import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ChevronLeft, Gem, Plus, HelpCircle, Volume2, Pencil, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const ROWS = 10;
const MULTS = [10, 5, 3, 2, 1.5, 0, 1.5, 2, 3, 5, 10];
const BETS = [0.1, 1, 5, 10];
const NAMES = ['Anik', 'Rakib', 'Sumaiya', 'Tahsin', 'Nila', 'Mahir', 'Zara', 'Rifat', 'Opal', 'Jihan'];

function colorFor(m) {
  if (m >= 10) return { bg: '#d53f8c', glow: 'rgba(213,63,140,0.6)' };
  if (m >= 5) return { bg: '#ecc94b', glow: 'rgba(236,201,75,0.6)' };
  if (m >= 3) return { bg: '#e53e3e', glow: 'rgba(229,62,62,0.6)' };
  if (m >= 2) return { bg: '#6b3fa0', glow: 'rgba(107,63,160,0.6)' };
  if (m >= 1.5) return { bg: '#4299e1', glow: 'rgba(66,153,225,0.6)' };
  return { bg: '#718096', glow: 'rgba(113,128,150,0.5)' };
}

function makeFeedItem() {
  const pick = MULTS.filter((m) => m > 0);
  return { name: NAMES[Math.floor(Math.random() * NAMES.length)], mult: pick[Math.floor(Math.random() * pick.length)] };
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg py-2 bg-white/5 border border-white/10">
      <p className="text-[9px] text-white/40 tracking-widest uppercase">{label}</p>
      <p className={`text-xs font-bold tabular-nums ${accent ? 'text-fuchsia-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function Plinko() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('plinko');
  const [betIdx, setBetIdx] = useState(1);
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState(null);
  const [resultBucket, setResultBucket] = useState(null);
  const [message, setMessage] = useState('Drop the ball');
  const [lastWin, setLastWin] = useState(0);
  const [feed, setFeed] = useState(() => Array.from({ length: 10 }, () => makeFeedItem()));
  const [copied, setCopied] = useState(false);
  const timers = useRef([]);
  const bet = BETS[betIdx];
  const logActivity = useLogActivity();

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((f) => [makeFeedItem(), ...f].slice(0, 12));
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  const share = () => {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  const drop = () => {
    if (dropping) return;
    if (balance < bet) { setMessage('Not enough balance'); return; }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBalance((b) => b - bet);
    setDropping(true);
    setResultBucket(null);
    setLastWin(0);
    setMessage('Dropping…');
    setBallPos(null);

    const profitIdx = MULTS.map((_, i) => i).filter((i) => MULTS[i] >= 1);
    const loseIdx = MULTS.map((_, i) => i).filter((i) => MULTS[i] < 1);
    let bucket;
    if (Math.random() < rtp / 100) bucket = profitIdx[Math.floor(Math.random() * profitIdx.length)];
    else bucket = (loseIdx.length ? loseIdx : profitIdx)[Math.floor(Math.random() * (loseIdx.length || profitIdx.length))];

    const steps = Array.from({ length: ROWS }, (_, i) => (i < bucket ? 1 : 0));
    for (let i = steps.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [steps[i], steps[j]] = [steps[j], steps[i]]; }
    const path = [{ row: 0, col: 0 }];
    let col = 0;
    for (let r = 1; r <= ROWS; r++) { col += steps[r - 1]; path.push({ row: r, col }); }

    let step = 0;
    const animate = () => {
      setBallPos(path[step]);
      if (step < path.length - 1) {
        const t = setTimeout(() => { step++; animate(); }, 110);
        timers.current.push(t);
      } else {
        const t = setTimeout(() => {
          const mult = MULTS[bucket];
          const win = bet * mult;
          if (win > 0) setBalance((b) => b + win);
          setLastWin(win);
          setResultBucket(bucket);
          setMessage(mult > 0 ? `${mult}x · +$${win.toFixed(2)}` : `0x · No win`);
          logActivity('plinko', bet, win, win > 0 ? 'win' : 'loss');
          setDropping(false);
          setFeed((f) => [{ name: 'You', mult, mine: true }, ...f].slice(0, 12));
        }, 200);
        timers.current.push(t);
      }
    };
    animate();
  };

  const pos = (row, col) => ({
    left: `${((col + 0.5) / (row + 1)) * 100}%`,
    top: `${((row + 0.5) / (ROWS + 1)) * 80}%`,
  });

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'radial-gradient(circle at 50% 0%, #1a0f2e 0%, #0a0a12 55%, #000 100%)' }}>
      <div className="fixed inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #b9a, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #c8e, transparent), radial-gradient(1px 1px at 10% 70%, #fff, transparent)', backgroundSize: '300px 300px' }} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-white/5">
        <div className="max-w-md mx-auto px-3 py-3 flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-1.5">
            <Gem className="w-5 h-5 text-fuchsia-400" />
            <span className="text-sm font-black">Plinko Drop</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700" />
            <span className="text-xs font-bold tabular-nums">{Number(balance).toFixed(2)}</span>
          </div>
          <Link to="/dashboard" className="w-7 h-7 rounded-full bg-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-900/40">
            <Plus className="w-4 h-4" />
          </Link>
          <button onClick={share} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
            {copied ? <Check className="w-[14px] h-[14px] text-emerald-400" /> : <Share2 className="w-[14px] h-[14px]" />}
          </button>
        </div>
      </header>

      {/* Live feed */}
      <div className="relative z-10 max-w-md mx-auto w-full mt-2">
        <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
          {feed.map((it, i) => {
            const c = colorFor(it.mult);
            return (
              <div key={i} className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: c.bg, color: '#1a1a1a' }}>{it.name[0]}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: c.bg }}>{it.mult}x</span>
                <span className="text-[10px] text-white/40">{it.name === 'You' ? 'you' : it.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Board area */}
      <main className="relative z-10 max-w-md mx-auto w-full px-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-white/60">
            <span className="w-7 h-4 rounded-full bg-white/10 relative">
              <span className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white/40" />
            </span>
            Demo
          </button>
          <HelpCircle className="w-5 h-5 text-white/40" />
        </div>

        {/* Board */}
        <div className="relative w-full mx-auto rounded-2xl bg-gradient-to-b from-[#1a0f2e]/60 to-black/60 border border-white/5 p-2" style={{ maxWidth: 340, aspectRatio: '3 / 4.2' }}>
          {Array.from({ length: ROWS + 1 }).map((_, r) =>
            Array.from({ length: r + 1 }).map((_, c) => (
              <span
                key={`p-${r}-${c}`}
                className="absolute rounded-full"
                style={{ ...pos(r, c), transform: 'translate(-50%,-50%)', width: 6, height: 6, background: 'radial-gradient(circle, #b58bf0, #6b3fa0)', boxShadow: '0 0 4px rgba(180,120,255,0.6)' }}
              />
            ))
          )}
          {ballPos && (
            <span
              className="absolute rounded-full z-10"
              style={{ ...pos(ballPos.row, ballPos.col), transform: 'translate(-50%,-50%)', width: 12, height: 12, background: 'radial-gradient(circle at 35% 30%, #fff, #c9a)', boxShadow: '0 0 10px rgba(255,255,255,0.9)', transition: 'left 0.1s linear, top 0.1s linear' }}
            />
          )}
          <div className="absolute inset-x-0 bottom-1 flex gap-0.5 px-1">
            {MULTS.map((m, i) => {
              const c = colorFor(m);
              const hit = resultBucket === i;
              return (
                <div
                  key={i}
                  className="flex-1 text-center rounded-md py-1 text-[9px] font-black tabular-nums transition-all"
                  style={{
                    background: hit ? c.bg : `${c.bg}33`,
                    color: hit ? '#fff' : c.bg,
                    boxShadow: hit ? `0 0 14px ${c.glow}` : 'none',
                    border: `1px solid ${c.bg}55`,
                  }}
                >
                  {m}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="mt-3 text-center">
          <span className="text-sm font-black text-fuchsia-300">{message}</span>
        </div>

        {/* Bottom controls */}
        <div className="mt-3 flex items-center justify-between">
          <button className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-white/50" />
          </button>
          <span className="text-[11px] text-white/40">Bet amount</span>
        </div>

        {/* Bet row */}
        <div className="mt-2 flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Pencil className="w-4 h-4 text-white/40" />
          </button>
          <div className="flex-1 grid grid-cols-4 gap-2">
            {BETS.map((b, i) => (
              <button
                key={b}
                disabled={dropping}
                onClick={() => setBetIdx(i)}
                className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50"
                style={betIdx === i
                  ? { background: 'linear-gradient(to bottom, #8a2be2, #6b3fa0)', border: '1px solid #b58bf0', color: '#fff', boxShadow: '0 0 10px rgba(138,43,226,0.5)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                }
              >
                <Gem className="w-3 h-3 text-fuchsia-300" /> {b}
              </button>
            ))}
          </div>
          <button onClick={() => setBetIdx((i) => Math.max(0, i - 1))} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <RotateCw className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Drop button */}
        <button
          onClick={drop}
          disabled={dropping}
          className="mt-4 w-full py-4 rounded-xl text-base font-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to bottom, #8a2be2, #6b22b8)', boxShadow: '0 4px 16px rgba(138,43,226,0.45)' }}
        >
          <Gem className="w-5 h-5" /> {dropping ? 'Dropping…' : `Drop · ${bet}`}
        </button>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2 pb-6 text-center">
          <Stat label="Balance" value={`$${balance.toFixed(2)}`} />
          <Stat label="Bet" value={`$${bet.toFixed(2)}`} />
          <Stat label="Last Win" value={`$${lastWin.toFixed(2)}`} accent={lastWin > 0} />
        </div>
      </main>
    </div>
  );
}