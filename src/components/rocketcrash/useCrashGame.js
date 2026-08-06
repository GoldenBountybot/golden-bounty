import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLogActivity } from '@/lib/useLogActivity';
import { playTakeoff, startFlying, stopFlying, playBlast } from './crashSounds';

const WAIT_MS = 5000;        // betting window (must match server)
const GROWTH = 1.10;         // multiplier = GROWTH ^ elapsedSec
const POLL_MS = 1000;        // how often we sync with the shared round

// 100 prefixes × 10 nuclei × 20 codas = 20,000 unique handle combinations,
// so names never repeat within a round and vary across rounds.
const PRE = ['Crypto', 'Neo', 'Cyber', 'Sky', 'Star', 'Moon', 'Sun', 'Fire', 'Ice', 'Storm',
  'Aero', 'Bolt', 'Comet', 'Drift', 'Ember', 'Frost', 'Gem', 'Halo', 'Jet', 'Luna',
  'Onyx', 'Pixel', 'Quartz', 'Raven', 'Sable', 'Tango', 'Viper', 'Apex', 'Blaze', 'Echo',
  'Hawk', 'Iris', 'Jett', 'Kilo', 'Nova', 'Prism', 'Rune', 'Shade', 'Trace', 'Volt',
  'Wisp', 'Zen', 'Ash', 'Bram', 'Cove', 'Dusk', 'Fern', 'Glen', 'Haze', 'Ivy',
  'Jinx', 'Kite', 'Lynx', 'Myth', 'Nyx', 'Orbit', 'Pace', 'Quill', 'Ridge', 'Sage',
  'Tidal', 'Ursa', 'Vault', 'Wilde', 'Xeno', 'Yeti', 'Zion', 'Arc', 'Brio', 'Dex',
  'Flux', 'Glide', 'Hex', 'Karma', 'Lyric', 'Mirage', 'Pax', 'Quest', 'Riff', 'Slate',
  'Tide', 'Vex', 'Whim', 'Yarn', 'Zest', 'Drako', 'Kael', 'Rho', 'Sylph', 'Tor',
  'Wren', 'Yoke', 'Zephyr', 'Cobalt', 'Delta', 'Gage', 'Helix', 'Indra', 'Jolt', 'Krait'];
const NUC = ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'io', 'ou', 'ia'];
const COD = ['n', 'r', 's', 't', 'l', 'm', 'k', 'x', 'z', 'd', 'nt', 'nd', 'st', 'sh', 'th', 'ng', 'rm', 'rn', 'rs', 'rl'];
const NAME_SPACE = PRE.length * NUC.length * COD.length; // 20,000

// Deterministic PRNG so every user sees the same fake live-bet list per round.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Decode a flat index (0..19,999) into a unique prefix+nucleus+coda handle.
function nameForIndex(idx) {
  const p = idx % PRE.length;
  const s = Math.floor(idx / PRE.length);          // 0..199
  const nuc = NUC[s % NUC.length];
  const cod = COD[Math.floor(s / NUC.length)];
  const syl = nuc + cod;
  return PRE[p] + syl.charAt(0).toUpperCase() + syl.slice(1);
}

// Generate 200+ fake live bets. Amounts descend strictly from $500 to $0.10
// with random (uneven) gaps so neighbouring bets aren't close, and every name
// is unique within the round (drawn without replacement from 20,000 handles).
function genLiveBets(roundId) {
  const rnd = mulberry32((roundId || 1) * 2654435761);
  const n = 300 + Math.floor(rnd() * 61); // 300–360 players

  // Random descending amounts with random gaps: split the $500→$0.10 range
  // into n-1 random-weighted slices so gaps vary (e.g. 500, 485, 464, …).
  const gaps = Array.from({ length: n - 1 }, () => rnd());
  const sum = gaps.reduce((a, b) => a + b, 0) || 1;
  const range = 500 - 0.10;
  const amounts = [500];
  let cum = 0;
  for (let i = 0; i < n - 1; i++) {
    cum += (gaps[i] / sum) * range;
    amounts.push(+(500 - cum).toFixed(2));
  }

  // Pick n distinct name indices without replacement.
  const used = new Set();
  const arr = [];
  for (let i = 0; i < n; i++) {
    let idx;
    do { idx = Math.floor(rnd() * NAME_SPACE); } while (used.has(idx));
    used.add(idx);
    arr.push({
      id: roundId + '-' + i,
      name: nameForIndex(idx),
      amount: amounts[i],
      cashOutAt: +(1.15 + rnd() * 9).toFixed(2),
      cashedOut: false,
      win: 0,
    });
  }
  return arr;
}

const newPanel = () => ({ amount: 1, placed: false, cashedOut: false, cashOutMult: null, autoBet: false, autoCashout: 0, win: 0 });

export function useCrashGame() {
  const { balance, setBalance } = useCasinoBalance();
  const logActivity = useLogActivity();

  const [phase, setPhase] = useState('waiting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState([]);
  const [countdown, setCountdown] = useState(WAIT_MS);
  const [bets, setBets] = useState([newPanel(), newPanel()]);
  const [liveBets, setLiveBets] = useState([]);
  const [roundId, setRoundId] = useState(0);

  const rafRef = useRef(null);
  const phaseRef = useRef('waiting');
  const multRef = useRef(1.00);
  const betsRef = useRef(bets);
  const liveRef = useRef(liveBets);
  const balanceRef = useRef(balance);
  const serverOffsetRef = useRef(0);
  const roundIdRef = useRef(0);
  const waitStartRef = useRef(0);
  const runStartRef = useRef(0);
  const crashPointRef = useRef(1);
  const lastCountdownRef = useRef(WAIT_MS);
  const loggedRoundRef = useRef(0);
  const playerNameRef = useRef('You');

  // Fetch the player's display name once so their bet shows at the top of the list.
  useEffect(() => {
    base44.auth.me()
      .then((u) => { playerNameRef.current = u?.username || u?.full_name || 'You'; })
      .catch(() => {});
  }, []);

  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => { liveRef.current = liveBets; }, [liveBets]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // Phase-driven sound effects: takeoff + engine rumble while flying, blast on crash.
  const prevPhaseRef = useRef('waiting');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (phase === prev) return;
    if (phase === 'running' && prev !== 'running') { playTakeoff(); startFlying(); }
    else if (phase === 'crashed' && prev !== 'crashed') { playBlast(); }
    else if (phase === 'waiting') { stopFlying(); }
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => () => stopFlying(), []);

  // Rebuild the player's own entries in the live-bet list from placed panels,
  // so the user's name always appears at the top when they have an active bet.
  const syncPlayerEntries = useCallback(() => {
    const rest = liveRef.current.filter((lb) => !lb.isPlayer);
    const playerEntries = betsRef.current
      .map((b, i) => ({ b, i }))
      .filter((x) => x.b.placed)
      .map((x) => ({
        id: 'player-' + x.i,
        name: playerNameRef.current,
        amount: x.b.amount,
        cashedOut: x.b.cashedOut,
        cashOutAt: x.b.cashOutMult,
        cashOutMult: x.b.cashOutMult,
        win: x.b.win,
        isPlayer: true,
      }));
    liveRef.current = [...playerEntries, ...rest];
    setLiveBets(liveRef.current);
  }, []);

  // Apply a snapshot of the shared round coming from the server.
  const applyState = useCallback((data) => {
    if (!data) return;
    serverOffsetRef.current = data.now - Date.now();

    const prevRound = roundIdRef.current;
    const newRound = data.round_id !== prevRound;

    if (newRound) {
      roundIdRef.current = data.round_id;
      setRoundId(data.round_id);

      // Reset panels for the new round; auto-bet only fires during the waiting window.
      let balDelta = 0;
      const reset = betsRef.current.map((b) => {
        const r = { ...b, placed: false, cashedOut: false, cashOutMult: null, win: 0 };
        if (data.phase === 'waiting' && b.autoBet && balanceRef.current + balDelta >= b.amount) {
          balDelta -= b.amount;
          return { ...r, placed: true };
        }
        return r;
      });
      if (balDelta) { balanceRef.current += balDelta; setBalance((bal) => bal + balDelta); }
      betsRef.current = reset;
      setBets(reset);

      liveRef.current = genLiveBets(data.round_id);
      setLiveBets(liveRef.current);
      // Re-insert the player's auto-bet entries at the top of the fresh list.
      syncPlayerEntries();

      setHistory(data.history || []);

      // Fresh round — reset local phase/timers to the server snapshot.
      phaseRef.current = data.phase;
      setPhase(data.phase);
      waitStartRef.current = data.wait_start;
      runStartRef.current = data.run_start;
      crashPointRef.current = data.crash_point;
    } else {
      // Same round — sync timers but never regress a locally-advanced phase.
      waitStartRef.current = data.wait_start;
      crashPointRef.current = data.crash_point;
      if (!runStartRef.current) runStartRef.current = data.run_start;

      if (data.phase === 'running' && phaseRef.current === 'waiting') {
        phaseRef.current = 'running';
        setPhase('running');
        if (!runStartRef.current) runStartRef.current = data.run_start;
      }
      if (data.phase === 'crashed' && phaseRef.current !== 'crashed') {
        phaseRef.current = 'crashed';
        setPhase('crashed');
      }
      if (data.phase === 'crashed') setHistory(data.history || []);
    }

    // Log once per round when the server confirms the bust.
    if (data.phase === 'crashed' && loggedRoundRef.current !== data.round_id) {
      loggedRoundRef.current = data.round_id;
      const totalBet = betsRef.current.reduce((s, b) => s + (b.placed ? b.amount : 0), 0);
      const totalWin = betsRef.current.reduce((s, b) => s + (b.cashedOut ? b.win : 0), 0);
      // Odds: the player's cash-out multiplier when they won, otherwise the
      // round's bust point (the odds they missed).
      const cashed = betsRef.current.find((b) => b.cashedOut && b.cashOutMult);
      const odds = cashed ? cashed.cashOutMult : crashPointRef.current;
      logActivity('rocket-crash', totalBet, totalWin, totalWin > 0 ? 'win' : 'loss', odds);
    }
  }, [logActivity, setBalance]);

  // Poll the shared round orchestrator.
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await base44.functions.invoke('crashRoundTick', {});
        if (active && res && res.data) applyState(res.data);
      } catch (_e) {}
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(id); };
  }, [applyState]);

  // Smooth local rendering + auto cashouts between server syncs.
  // Local phase transitions happen the instant the timers say so — the
  // rocket takes off and busts without waiting for the next poll.
  useEffect(() => {
    const loop = () => {
      const now = Date.now() + serverOffsetRef.current;
      const ph = phaseRef.current;

      if (ph === 'waiting') {
        if (waitStartRef.current > 0) {
          const left = Math.max(0, WAIT_MS - (now - waitStartRef.current));
          if (Math.abs(left - lastCountdownRef.current) >= 100 || left === 0) {
            lastCountdownRef.current = left;
            setCountdown(left);
          }
          if (multRef.current !== 1.00) { multRef.current = 1.00; setMultiplier(1.00); }
          // Local takeoff the instant the betting window ends.
          if (now - waitStartRef.current >= WAIT_MS) {
            phaseRef.current = 'running';
            runStartRef.current = waitStartRef.current + WAIT_MS;
            setPhase('running');
          }
        }
      } else if (ph === 'running') {
        const elapsed = (now - runStartRef.current) / 1000;
        let m = Math.pow(GROWTH, Math.max(0, elapsed));
        const cp = crashPointRef.current;
        if (m >= cp) {
          // Local crash the instant the curve reaches the bust point.
          m = cp;
          multRef.current = m;
          setMultiplier(m);
          phaseRef.current = 'crashed';
          setPhase('crashed');
        } else {
          multRef.current = m;
          setMultiplier(m);
        }

        // auto cashout — player bets
        let balAdd = 0;
        let changed = false;
        const next = betsRef.current.map((b) => {
          if (b.placed && !b.cashedOut && b.autoCashout > 0 && m >= b.autoCashout) {
            const win = +(b.amount * b.autoCashout).toFixed(2);
            balAdd += win; changed = true;
            return { ...b, cashedOut: true, cashOutMult: +m.toFixed(2), win };
          }
          return b;
        });
        if (changed) { betsRef.current = next; setBets(next); setBalance((bal) => bal + balAdd); syncPlayerEntries(); }

        // auto cashout — shared live bets
        let lbChanged = false;
        const lbnext = liveRef.current.map((lb) => {
          if (!lb.cashedOut && m >= lb.cashOutAt) {
            lbChanged = true;
            return { ...lb, cashedOut: true, win: +(lb.amount * lb.cashOutAt).toFixed(2) };
          }
          return lb;
        });
        if (lbChanged) { liveRef.current = lbnext; setLiveBets(lbnext); }
      } else if (ph === 'crashed') {
        if (multRef.current !== crashPointRef.current) {
          multRef.current = crashPointRef.current;
          setMultiplier(crashPointRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const placeBet = (i) => {
    if (phaseRef.current !== 'waiting') return;
    const b = betsRef.current[i];
    if (b.placed) return;
    if (balanceRef.current < b.amount) return;
    setBalance((bal) => bal - b.amount);
    balanceRef.current -= b.amount;
    const next = betsRef.current.map((bb, idx) => (idx === i ? { ...bb, placed: true } : bb));
    betsRef.current = next;
    setBets(next);
    syncPlayerEntries();
  };

  const cancelBet = (i) => {
    if (phaseRef.current !== 'waiting') return;
    const b = betsRef.current[i];
    if (!b.placed) return;
    setBalance((bal) => bal + b.amount);
    balanceRef.current += b.amount;
    const next = betsRef.current.map((bb, idx) => (idx === i ? { ...bb, placed: false } : bb));
    betsRef.current = next;
    setBets(next);
    syncPlayerEntries();
  };

  const cashOut = (i) => {
    if (phaseRef.current !== 'running') return;
    const b = betsRef.current[i];
    if (!b.placed || b.cashedOut) return;
    const m = multRef.current;
    const win = +(b.amount * m).toFixed(2);
    setBalance((bal) => bal + win);
    balanceRef.current += win;
    const next = betsRef.current.map((bb, idx) =>
      (idx === i ? { ...bb, cashedOut: true, cashOutMult: +m.toFixed(2), win } : bb));
    betsRef.current = next;
    setBets(next);
    syncPlayerEntries();
  };

  const setAmount = (i, amt) => {
    const n = +(amt || 0);
    const v = Math.max(0.10, Math.min(500, +(isFinite(n) ? n : 0).toFixed(2)));
    setBets((prev) => prev.map((b, idx) => (idx === i ? { ...b, amount: v } : b)));
  };
  const toggleAutoBet = (i) => setBets((prev) => prev.map((b, idx) => (idx === i ? { ...b, autoBet: !b.autoBet } : b)));
  const toggleAutoCashout = (i) => setBets((prev) => prev.map((b, idx) => (idx === i ? { ...b, autoCashout: b.autoCashout > 0 ? 0 : 2 } : b)));
  const setAutoCashout = (i, v) => setBets((prev) => prev.map((b, idx) => (idx === i ? { ...b, autoCashout: Math.max(1.01, +v || 0) } : b)));

  return {
    phase, multiplier, history, countdown, bets, liveBets, balance, roundId,
    placeBet, cancelBet, cashOut, setAmount, toggleAutoBet, toggleAutoCashout, setAutoCashout,
  };
}