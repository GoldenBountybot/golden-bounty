import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ChevronLeft, DollarSign, Plus, Pencil, Share2, Check, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const MULTS = [50, 25, 15, 10, 5, 3, 2, 1.5, 0, 1.5, 2, 3, 5, 10, 15, 25, 50];
const ROWS = MULTS.length - 1;
const BETS = [0.1, 1, 5, 10];

const FONT = "'Rye, Georgia, serif'";
const woodFrame = {
  border: '1px solid rgba(190,140,55,0.75)',
  background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 6px rgba(0,0,0,0.55)',
};
const woodBtn = {
  border: '1px solid rgba(190,140,55,0.7)',
  background: 'linear-gradient(to bottom, rgba(74,52,24,0.95), rgba(40,27,12,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 1px 3px rgba(0,0,0,0.5)',
};
const goldBtn = {
  border: '1px solid rgba(245,210,120,0.9)',
  background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
  boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)',
  color: '#2a1a06',
};

function colorFor(m) {
  if (m >= 10) return { bg: '#d53f8c', glow: 'rgba(213,63,140,0.6)' };
  if (m >= 5) return { bg: '#ecc94b', glow: 'rgba(236,201,75,0.6)' };
  if (m >= 3) return { bg: '#e53e3e', glow: 'rgba(229,62,62,0.6)' };
  if (m >= 2) return { bg: '#6b3fa0', glow: 'rgba(107,63,160,0.6)' };
  if (m >= 1.5) return { bg: '#4299e1', glow: 'rgba(66,153,225,0.6)' };
  return { bg: '#718096', glow: 'rgba(113,128,150,0.5)' };
}

function Stat({ label, value, accent }) {
  return (
    <div className="py-2 text-center" style={{ ...woodFrame, fontFamily: FONT }}>
      <p className="text-[9px] text-amber-100/60 tracking-widest uppercase">{label}</p>
      <p className="text-xs font-bold tabular-nums" style={{ color: accent ? '#f5c542' : '#f3e2b3' }}>{value}</p>
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
  const [copied, setCopied] = useState(false);
  const timers = useRef([]);
  const bet = BETS[betIdx];
  const logActivity = useLogActivity();

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

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
        const t = setTimeout(() => { step++; animate(); }, 260);
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
        }, 200);
        timers.current.push(t);
      }
    };
    animate();
  };

  const pos = (row, col) => ({
    left: `${((col + 0.5) / (row + 1)) * 100}%`,
    top: `${((row + 0.5) / (ROWS + 1)) * 92}%`,
  });

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'radial-gradient(circle at 50% 0%, #1a0f2e 0%, #0a0a12 55%, #000 100%)' }}>
      <div className="fixed inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #b9a, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #c8e, transparent), radial-gradient(1px 1px at 10% 70%, #fff, transparent)', backgroundSize: '300px 300px' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0dafcc686_.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18, mixBlendMode: 'screen' }} />

      {/* Header — western wooden bar */}
      <header className="sticky top-0 z-30" style={{ ...woodFrame, borderBottomWidth: 1, fontFamily: FONT, borderRadius: 0, background: 'linear-gradient(to bottom, rgba(58,40,18,0.96), rgba(26,18,9,0.98))' }}>
        <div className="max-w-md mx-auto px-3 py-3 flex items-center gap-2.5">
          <Link to="/" className="w-9 h-9 flex items-center justify-center" style={{ ...woodBtn, color: '#f3e2b3' }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-5 h-5" style={{ color: '#f5c542' }} />
            <span className="text-sm font-black italic" style={{ color: '#f3e2b3' }}>Plinko Drop</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ ...woodBtn }}>
            <Wallet className="w-4 h-4" style={{ color: '#f5c542' }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: '#f3e2b3', fontFamily: FONT }}>${Number(balance).toFixed(2)}</span>
          </div>
          <Link to="/dashboard" className="w-8 h-8 flex items-center justify-center" style={{ ...goldBtn }}>
            <Plus className="w-4 h-4" />
          </Link>
          <button onClick={share} className="w-9 h-9 flex items-center justify-center" style={{ ...woodBtn, color: '#f3e2b3' }}>
            {copied ? <Check className="w-[14px] h-[14px]" style={{ color: '#f5c542' }} /> : <Share2 className="w-[14px] h-[14px]" />}
          </button>
        </div>
      </header>

      {/* Board area */}
      <main className="relative z-10 max-w-md mx-auto w-full px-3 flex-1 flex flex-col">
        {/* Board */}
        <div className="relative w-full mx-auto" style={{ maxWidth: 300, aspectRatio: '1 / 1.15' }}>
          {Array.from({ length: ROWS + 1 }).map((_, r) =>
            Array.from({ length: r + 1 }).map((_, c) => (
              <span
                key={`p-${r}-${c}`}
                className="absolute rounded-full"
                style={{ ...pos(r, c), transform: 'translate(-50%,-50%)', width: 7, height: 7, background: 'radial-gradient(circle at 35% 30%, #e8e8ff, #c3c3e4 55%, #8a8ac0)', boxShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(195,195,228,0.4)' }}
              />
            ))
          )}
          {ballPos && (
            <span
              className="absolute rounded-full z-10"
              style={{ ...pos(ballPos.row, ballPos.col), transform: 'translate(-50%,-50%)', width: 14, height: 14, background: 'radial-gradient(circle at 35% 30%, #fff7d6, #f5c518 45%, #b8860b)', boxShadow: '0 0 12px rgba(245,197,24,0.95), 0 0 20px rgba(245,197,24,0.5)', transition: 'left 0.26s linear, top 0.26s linear' }}
            />
          )}
          <div className="absolute inset-x-0 bottom-1 flex gap-0.5 px-1">
            {MULTS.map((m, i) => {
              const c = colorFor(m);
              const hit = resultBucket === i;
              return (
                <div
                  key={i}
                  className="flex-1 text-center py-1 text-[7px] font-black tabular-nums transition-all"
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

        {/* Message — wooden plaque */}
        <div className="mt-3 mx-auto px-6 py-1.5 relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bed350a7c_generated_image.png') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))", border: '1px solid rgba(190,140,55,0.75)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)' }}>
          <span className="relative text-sm font-black italic" style={{ color: '#f5c542', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{message}</span>
        </div>

        {/* Bet row — wooden frame */}
        <div className="mt-3 p-2 flex items-center gap-2" style={{ ...woodFrame }}>
          <button className="w-10 h-10 flex items-center justify-center" style={{ ...woodBtn, color: '#d9b97a' }}>
            <Pencil className="w-4 h-4" />
          </button>
          <div className="flex-1 grid grid-cols-4 gap-2">
            {BETS.map((b, i) => (
              <button
                key={b}
                disabled={dropping}
                onClick={() => setBetIdx(i)}
                className="flex items-center justify-center gap-0.5 py-2 text-xs font-bold italic transition-colors disabled:opacity-50"
                style={betIdx === i
                  ? { ...goldBtn, fontFamily: FONT }
                  : { ...woodBtn, color: '#d9b97a', fontFamily: FONT }
                }
              >
                ${b}
              </button>
            ))}
          </div>
          <button onClick={() => setBetIdx((i) => Math.max(0, i - 1))} className="w-10 h-10 flex items-center justify-center" style={{ ...woodBtn, color: '#d9b97a' }}>
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Drop button — gold western */}
        <button
          onClick={drop}
          disabled={dropping}
          className="mt-4 w-full py-4 text-base font-black italic transition-all disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden"
          style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/584e9a6ed_generated_image.png') center / cover, linear-gradient(to bottom, #f5c542, #c8881e)", border: '1px solid rgba(245,210,120,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)', color: '#2a1a06', fontFamily: FONT, textShadow: '0 1px 1px rgba(255,240,200,0.4)' }}
        >
          <DollarSign className="w-5 h-5 relative" /> <span className="relative">{dropping ? 'Dropping…' : `Drop · $${bet}`}</span>
        </button>

        {/* Stats — wooden tiles */}
        <div className="mt-3 grid grid-cols-3 gap-2 pb-6 text-center">
          <Stat label="Balance" value={`$${balance.toFixed(2)}`} />
          <Stat label="Bet" value={`$${bet.toFixed(2)}`} />
          <Stat label="Last Win" value={`$${lastWin.toFixed(2)}`} accent={lastWin > 0} />
        </div>
      </main>
    </div>
  );
}