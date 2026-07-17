import { useState, useRef, useEffect } from 'react';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const WAIT_MS = 5000;        // betting window before each round
const CRASH_HOLD_MS = 3500;  // show crash result before next round
const GROWTH = 1.18;          // multiplier = GROWTH ^ elapsedSec  (doubles ~ every 4.3s)

const NAMES = ['Crypto_Kid', 'xX_Rider', 'FlyHigh', 'AcePilot', 'Midnight', 'BlueFox',
  'GoldRush', 'NeonSam', 'QuickDraw', 'Vega', 'Lucky7', 'Storm', 'Maverick', 'Phoenix',
  'Zara', 'Rex', 'Nova', 'Dynamo', 'Blaze', 'Echo', 'Hawk', 'Iris', 'Jett', 'Kilo',
  'Luna', 'Onyx', 'Pixel', 'Quartz', 'Raven', 'Sable', 'Tango', 'Viper'];

// Provably-fair style crash point from RTP: P(crash <= m) = 1 - rtp/m
function genCrashPoint(rtp) {
  const r = Math.random();
  let crash = (rtp / 100) / (1 - r);
  if (crash < 1.00) crash = 1.00;   // instant bust
  return Math.min(crash, 250);
}

function genLiveBets() {
  const n = 10 + Math.floor(Math.random() * 16);
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      id: Math.random().toString(36).slice(2),
      name: NAMES[Math.floor(Math.random() * NAMES.length)] + (Math.floor(Math.random() * 900) + 100),
      amount: +(Math.random() * 95 + 1).toFixed(2),
      cashOutAt: +(1.15 + Math.random() * 9).toFixed(2),
      cashedOut: false,
      win: 0,
    });
  }
  return arr;
}

export function useCrashGame() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('rocket-crash');
  const logActivity = useLogActivity();
  const rtpRef = useRef(97);
  useEffect(() => { rtpRef.current = rtp || 97; }, [rtp]);

  const [phase, setPhase] = useState('waiting');      // waiting | running | crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState(() =>
    Array.from({ length: 16 }, () => +(1 + Math.random() * 4).toFixed(2)));
  const [countdown, setCountdown] = useState(WAIT_MS);
  const [bets, setBets] = useState([
    { amount: 1, placed: false, cashedOut: false, cashOutMult: null, autoBet: false, autoCashout: 0, win: 0 },
    { amount: 1, placed: false, cashedOut: false, cashOutMult: null, autoBet: false, autoCashout: 0, win: 0 },
  ]);
  const [liveBets, setLiveBets] = useState([]);

  const rafRef = useRef(null);
  const startRef = useRef(0);
  const crashRef = useRef(0);
  const multRef = useRef(1.00);
  const phaseRef = useRef('waiting');
  const betsRef = useRef(bets);
  const liveRef = useRef(liveBets);
  const balanceRef = useRef(balance);
  const timers = useRef([]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => { liveRef.current = liveBets; }, [liveBets]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    timers.current.forEach(clearTimeout);
  }, []);

  // round lifecycle
  useEffect(() => {
    if (phase === 'waiting') {
      const cp = genCrashPoint(rtpRef.current);
      crashRef.current = cp;
      setLiveBets(genLiveBets());
      const start = Date.now();
      const tick = () => {
        const left = WAIT_MS - (Date.now() - start);
        setCountdown(Math.max(0, left));
        if (left <= 0) { setPhase('running'); startRef.current = Date.now(); return; }
        timers.current.push(setTimeout(tick, 100));
      };
      tick();
      return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    }

    if (phase === 'running') {
      const loop = () => {
        const elapsed = (Date.now() - startRef.current) / 1000;
        const m = Math.pow(GROWTH, elapsed);
        const cp = crashRef.current;
        if (m >= cp) { setMultiplier(cp); multRef.current = cp; setPhase('crashed'); return; }
        setMultiplier(m);
        multRef.current = m;

        // auto cashout — player bets
        let balAdd = 0;
        let changed = false;
        const next = betsRef.current.map(b => {
          if (b.placed && !b.cashedOut && b.autoCashout > 0 && m >= b.autoCashout) {
            const win = +(b.amount * b.autoCashout).toFixed(2);
            balAdd += win; changed = true;
            return { ...b, cashedOut: true, cashOutMult: +m.toFixed(2), win };
          }
          return b;
        });
        if (changed) { betsRef.current = next; setBets(next); setBalance(bal => bal + balAdd); }

        // auto cashout — live (fake) bets
        let lbChanged = false;
        const lbnext = liveRef.current.map(lb => {
          if (!lb.cashedOut && m >= lb.cashOutAt) {
            lbChanged = true;
            return { ...lb, cashedOut: true, win: +(lb.amount * lb.cashOutAt).toFixed(2) };
          }
          return lb;
        });
        if (lbChanged) { liveRef.current = lbnext; setLiveBets(lbnext); }

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }

    if (phase === 'crashed') {
      const totalBet = betsRef.current.reduce((s, b) => s + (b.placed ? b.amount : 0), 0);
      const totalWin = betsRef.current.reduce((s, b) => s + (b.cashedOut ? b.win : 0), 0);
      logActivity('rocket-crash', totalBet, totalWin, totalWin > 0 ? 'win' : 'loss');
      setHistory(h => [crashRef.current, ...h].slice(0, 22));

      const t = setTimeout(() => {
        // reset for next round + apply auto-bet
        let balDelta = 0;
        const reset = betsRef.current.map(b => {
          const r = { ...b, placed: false, cashedOut: false, cashOutMult: null, win: 0 };
          if (b.autoBet && balanceRef.current + balDelta >= b.amount) {
            balDelta -= b.amount;
            return { ...r, placed: true };
          }
          return r;
        });
        if (balDelta) { balanceRef.current += balDelta; setBalance(bal => bal + balDelta); }
        betsRef.current = reset;
        setBets(reset);
        setMultiplier(1.00);
        multRef.current = 1.00;
        setPhase('waiting');
      }, CRASH_HOLD_MS);
      timers.current.push(t);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const placeBet = (i) => {
    if (phaseRef.current !== 'waiting') return;
    const b = betsRef.current[i];
    if (b.placed) return;
    if (balanceRef.current < b.amount) return;
    setBalance(bal => bal - b.amount);
    balanceRef.current -= b.amount;
    const next = betsRef.current.map((bb, idx) => idx === i ? { ...bb, placed: true } : bb);
    betsRef.current = next;
    setBets(next);
  };

  const cancelBet = (i) => {
    if (phaseRef.current !== 'waiting') return;
    const b = betsRef.current[i];
    if (!b.placed) return;
    setBalance(bal => bal + b.amount);
    balanceRef.current += b.amount;
    const next = betsRef.current.map((bb, idx) => idx === i ? { ...bb, placed: false } : bb);
    betsRef.current = next;
    setBets(next);
  };

  const cashOut = (i) => {
    if (phaseRef.current !== 'running') return;
    const b = betsRef.current[i];
    if (!b.placed || b.cashedOut) return;
    const m = multRef.current;
    const win = +(b.amount * m).toFixed(2);
    setBalance(bal => bal + win);
    balanceRef.current += win;
    const next = betsRef.current.map((bb, idx) =>
      idx === i ? { ...bb, cashedOut: true, cashOutMult: +m.toFixed(2), win } : bb);
    betsRef.current = next;
    setBets(next);
  };

  const setAmount = (i, amt) => {
    const v = Math.max(0.10, Math.min(500, +(amt || 0).toFixed(2)));
    setBets(prev => prev.map((b, idx) => idx === i ? { ...b, amount: v } : b));
  };
  const toggleAutoBet = (i) => setBets(prev => prev.map((b, idx) => idx === i ? { ...b, autoBet: !b.autoBet } : b));
  const toggleAutoCashout = (i) => setBets(prev => prev.map((b, idx) => idx === i ? { ...b, autoCashout: b.autoCashout > 0 ? 0 : 2 } : b));
  const setAutoCashout = (i, v) => setBets(prev => prev.map((b, idx) => idx === i ? { ...b, autoCashout: Math.max(1.01, +v || 0) } : b));

  return {
    phase, multiplier, history, countdown, bets, liveBets, balance,
    placeBet, cancelBet, cashOut, setAmount, toggleAutoBet, toggleAutoCashout, setAutoCashout,
  };
}