import React, { useState, useEffect, useRef } from 'react';
import { Bomb, Pickaxe, DollarSign, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import PlayerHistoryButton from '@/components/PlayerHistoryButton';
import GameDesktopPanel from '@/components/GameDesktopPanel';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameAssetLoader from '@/components/GameAssetLoader';
import { MINES_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { isMuted, useMute } from '@/lib/soundMute';
import { startMinesMusic, stopMinesMusic } from '@/lib/minesSound';

const TOTAL = 25;
const COLS = 5;
const MIN_BET = 0.05;
const BETS = [0.1, 1, 10, 50, 100, 500];
const MINE_PRESETS = [1, 3, 5, 10, 24];

const W = { fontFamily: 'Rye, Georgia, serif' };

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}
function playDing(freq, t0, dur, type = 'triangle', gain = 0.18) {
  if (isMuted()) return;
  const ac = actx(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function playClick() {
  if (isMuted()) return;
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // sharp wooden thunk + metallic click
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(420, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + 0.1);
  // metallic ping overlay
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'triangle';
  o2.frequency.setValueAtTime(1200, t);
  g2.gain.setValueAtTime(0.12, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  o2.connect(g2); g2.connect(ac.destination);
  o2.start(t); o2.stop(t + 0.07);
}
function playCorrect() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playDing(660, t, 0.14);
  playDing(880, t + 0.08, 0.16);
  playDing(1175, t + 0.18, 0.22);
}
function playBoom() {
  if (isMuted()) return;
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // noise burst
  const buf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = ac.createBufferSource(); src.buffer = buf;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(120, t + 0.4);
  src.connect(lp); lp.connect(ng); ng.connect(ac.destination);
  src.start(t); src.stop(t + 0.5);
  // low thud
  const o = ac.createOscillator(); const og = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(og); og.connect(ac.destination);
  o.start(t); o.stop(t + 0.36);
}

const GIFT_STRIPES = ['#ffffff', '#e53935', '#1e88e5', '#fdd835', '#43a047'];



// House-edge-adjusted multiplier for k revealed safe tiles given m mines.
const EDGE = 0.03;
function multiplierFor(k, m) {
  const safe = TOTAL - m;
  if (k <= 0) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r *= (TOTAL - i) / (safe - i);
  return r * (1 - EDGE);
}

// Wooden-framed button style (gold-trim dark wood)
const woodBtn = (active, color = 'amber') => ({
  border: '1px solid rgba(190,140,55,0.85)',
  background: active
    ? `linear-gradient(to bottom, rgba(255,210,120,0.95), rgba(200,150,60,0.95))`
    : `linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))`,
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 5px rgba(0,0,0,0.55)',
  color: active ? '#1a1206' : 'rgba(255,220,150,0.92)',
});

export default function Mines() {
  const { balance, setBalance, beginRound, settleBet } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const [muted] = useMute();
  const musicStartedRef = useRef(false);
  const { rtp } = useGameSettings('mines');
  const [betIdx, setBetIdx] = useState(0);
  const [customBet, setCustomBet] = useState('');
  const bet = customBet ? Math.max(MIN_BET, Number(customBet)) : BETS[betIdx];
  const [mines, setMines] = useState(3);
  const safe = TOTAL - mines;

  const [phase, setPhase] = useState('idle'); // idle | playing | over
  const [mineSet, setMineSet] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [revealedOrder, setRevealedOrder] = useState([]);
  const [pot, setPot] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Place yer bet an\' pick the mines');
  const [forceFirstMine, setForceFirstMine] = useState(false);
  const serverWinRef = useRef(0);
  const startingRef = useRef(false);
  const logActivity = useLogActivity();

  const currentMult = pot;
  const nextMult = multiplierFor(revealedOrder.length + 1, mines);

  // Start the ambient luxury casino loop on the first user gesture (browsers
  // block AudioContext until a user interacts), then keep it playing. Stop
  // on unmount.
  useEffect(() => {
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      startMinesMusic();
      musicStartedRef.current = true;
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
    };
    window.addEventListener('pointerdown', begin);
    window.addEventListener('keydown', begin);
    return () => {
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
      stopMinesMusic();
    };
  }, []);

  // Sync background music with the mute toggle (only after first interaction).
  useEffect(() => {
    if (!musicStartedRef.current) return;
    if (muted) stopMinesMusic();
    else startMinesMusic();
  }, [muted]);

  const start = async () => {
    if (phase === 'playing' || startingRef.current) return;
    if (!bet || bet < MIN_BET) { setMessage('Min bet is $0.05'); return; }
    if (balance < bet) { setMessage('Not enough gold, partner'); return; }
    playClick();
    startingRef.current = true;
    const _serverRoundPromise = beginRound(bet, 'mines', false, 'cap');
    // Wait for the server's pre-decided outcome.
    const serverRound = await _serverRoundPromise;
    // If beginRound failed, the server did NOT deduct the bet (beginRound
    // already reverted its local deduction). Just abort.
    if (serverRound.failed) {
      startingRef.current = false;
      setPhase('idle');
      setMessage('Connection error — try again');
      return;
    }
    serverWinRef.current = Number(serverRound.win_amount ?? 0);
    const positions = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    setMineSet(new Set(positions.slice(0, mines)));
    setRevealed(new Set());
    setRevealedOrder([]);
    setPot(1);
    setLastWin(0);
    // The server now decides win/loss (cap mode). On a server-decided loss
    // (cap = 0), force the first pick to be a mine so the player loses
    // immediately. On a server-decided win (cap = max), let the player play
    // normally — their tile choices determine the actual win, capped at max.
    setForceFirstMine(serverWinRef.current === 0);
    startingRef.current = false;
    setPhase('playing');
    setMessage(`Find ${safe} gold bars · dodge ${mines} TNT`);
  };

  const reveal = (idx) => {
    if (phase !== 'playing' || revealed.has(idx)) return;
    const effective = new Set(mineSet);
    if (revealed.size === 0) {
      if (forceFirstMine) {
        if (!effective.has(idx)) {
          effective.add(idx);
          const others = [...effective].filter((x) => x !== idx);
          if (others.length) effective.delete(others[Math.floor(Math.random() * others.length)]);
        }
      } else if (effective.has(idx)) {
        effective.delete(idx);
        const cands = [];
        for (let i = 0; i < TOTAL; i++) if (i !== idx && !effective.has(i)) cands.push(i);
        if (cands.length) effective.add(cands[Math.floor(Math.random() * cands.length)]);
      }
      setMineSet(effective);
    }
    const newRev = new Set(revealed);
    newRev.add(idx);
    setRevealed(newRev);
    setRevealedOrder([...revealedOrder, idx]);

    if (effective.has(idx)) {
      playBoom();
      setPhase('over');
      setPot(0);
      settleBet(bet, 0, 'mines');
      setMessage('BOOM! Yer gold went up in smoke');
      logActivity('mines', bet, 0, 'loss');
      return;
    }
    playCorrect();
    const k = newRev.size;
    const newPot = multiplierFor(k, mines);
    setPot(newPot);
    if (k === safe) {
      const win = Math.min(bet * newPot, serverWinRef.current);
      settleBet(bet, win, 'mines');
      setLastWin(win);
      setMessage(`Strike it rich! +$${win.toFixed(2)} (${newPot.toFixed(2)}x)`);
      logActivity('mines', bet, win, 'win');
      setPhase('over');
    } else {
      setMessage(`Gold! Pot be $${(bet * newPot).toFixed(2)}`);
    }
  };

  const cashout = () => {
    if (phase !== 'playing' || revealed.size === 0) return;
    const win = Math.min(bet * pot, serverWinRef.current);
    settleBet(bet, win, 'mines');
    setLastWin(win);
    setMessage(`Cashed out $${win.toFixed(2)} (${pot.toFixed(2)}x)`);
    logActivity('mines', bet, win, 'win');
    setPhase('over');
  };

  const newGame = () => {
    setPhase('idle');
    setRevealed(new Set());
    setRevealedOrder([]);
    setMineSet(new Set());
    setPot(1);
    setMessage('Place yer bet an\' pick the mines');
  };

  const isOver = phase === 'over';
  const halfBet = () => +(Math.max(MIN_BET, bet / 2)).toFixed(2);
  const doubleBet = () => +(bet * 2).toFixed(2);

  return (
    <div className="min-h-screen text-amber-100 flex flex-col relative" style={{ background: 'linear-gradient(to bottom, #1a1108, #0d0905)', ...W }}>
      {!loaded && <GameAssetLoader title="Mines" assets={MINES_ASSETS} bgImage={GAME_BG.mines} onDone={() => setLoaded(true)} />}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/7ad5415af_.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5, mixBlendMode: 'screen' }} />
      <GameHeader title="Mines" balance={Number(balance || 0)} />

      <main className="max-w-none lg:max-w-[600px] xl:max-w-[660px] w-full mx-auto px-4 py-5 flex flex-col gap-4 flex-1">
        {/* Balance bar */}
        <WesternFrame className="px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span className="text-[9px] tracking-widest text-amber-300/70" style={W}>BAL</span>
            <span className="text-sm text-amber-200 tabular-nums" style={W}>${balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-widest text-amber-300/70" style={W}>PROFIT</span>
            <span className={`text-xs tabular-nums ${lastWin > 0 ? 'text-amber-300' : 'text-amber-100/50'}`} style={W}>
              {lastWin > 0 ? `+$${lastWin.toFixed(2)}` : '$0.00'}
            </span>
            <PlayerHistoryButton iconOnly gameId="mines" title="Mines History" />
          </div>
        </WesternFrame>

        {/* Grid — game board, above the bet button */}
        <WesternFrame className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isRev = revealed.has(i);
              const isMine = mineSet.has(i);
              const showMine = isRev && isMine;
              const showSafe = isRev && !isMine;
              const revealLost = isOver && isMine && !isRev;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={phase !== 'playing' || isRev}
                  className="aspect-square rounded-md flex items-center justify-center transition-all duration-150"
                  style={
                    showMine ? { background: 'radial-gradient(circle, #8b1a1a, #4a0a0a)', border: '1px solid #e0742b', boxShadow: '0 0 12px rgba(255,120,40,0.6)' }
                    : showSafe ? { background: 'linear-gradient(to bottom, rgba(40,28,14,0.95), rgba(20,14,7,0.95))', border: '1px solid rgba(190,140,55,0.8)' }
                    : revealLost ? { background: 'radial-gradient(circle, #3a0a0a, #1a0808)', border: '1px solid rgba(190,60,40,0.5)' }
                    : {
                        background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.94))',
                        border: '1px solid rgba(190,140,55,0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), inset 0 -2px 4px rgba(0,0,0,0.4)',
                      }
                  }
                >
                  {showMine ? <Bomb className="w-7 h-7 text-stone-900" style={{ filter: 'drop-shadow(0 0 6px rgba(255,120,40,0.8))' }} />
                    : showSafe ? <GoldBar />
                    : revealLost ? <Bomb className="w-6 h-6 text-rose-300/80" />
                    : <GiftBox />}
                </button>
              );
            })}
          </div>
        </WesternFrame>

        {/* Message — dark charcoal plaque, muted gold text */}
        <div className="w-full rounded-lg py-1.5 -mt-2 text-center" style={{ background: '#1a1a1a', border: '1px solid #b8860b', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          <span className="text-xs" style={{ color: '#c5a059', ...W }}>{message}</span>
        </div>

        {/* Bet button — ornate wood + gold filigree frame */}
        {phase !== 'playing' && (
          <>
            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
              <filter id="minesBetBg" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.2126 0.7152 0.0722 0 0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="20" intercept="-1" />
                </feComponentTransfer>
              </filter>
            </svg>
            <button onClick={start} disabled={balance < bet} className="w-full relative -mt-20 -mb-28 rounded-xl text-base transition-all disabled:opacity-40 overflow-hidden" style={{ ...W }}>
              <img src="https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/47e470df6_file_000000002200820baadd0a1f2df2f8ce.png" alt="" aria-hidden="true" className="block w-full h-auto pointer-events-none" style={{ filter: 'url(#minesBetBg)' }} />
              <div className="absolute inset-0 flex items-center justify-center gap-2 px-4" style={{ transform: 'translateY(-6px)' }}>
                <Pickaxe className="w-5 h-5" style={{ color: '#f0e68c', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }} />
                <span className="text-base" style={{ color: '#f0e68c', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>BET ${bet.toFixed(2)} · {mines} MINES</span>
              </div>
            </button>
          </>
        )}

        {/* Controls panel — custom amount + mines presets, below the bet button.
            Available whenever a round isn't in progress (idle or finished). */}
        {phase !== 'playing' && (
          <WesternFrame className="p-4 flex flex-col gap-4">
            {/* Bet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200" style={W}>BET AMOUNT</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCustomBet(String(halfBet()))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronDown className="w-4 h-4" /></button>
                  <input
                    value={customBet || bet}
                    onChange={(e) => setCustomBet(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-24 text-center rounded-md py-1 text-sm tabular-nums outline-none"
                    style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8', ...W }}
                  />
                  <button onClick={() => setCustomBet(String(doubleBet()))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronUp className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {BETS.map((b, i) => (
                  <button
                    key={b}
                    onClick={() => { setBetIdx(i); setCustomBet(''); }}
                    className="py-1.5 rounded-md text-xs transition-colors"
                    style={{ ...woodBtn(!customBet && betIdx === i), ...W }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Mines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200" style={W}>MINES</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMines((m) => Math.max(1, m - 1))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronDown className="w-4 h-4" /></button>
                  <input
                    value={mines}
                    onChange={(e) => { const n = Math.min(24, Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1)); setMines(n); }}
                    className="w-12 text-center rounded-md py-1 text-sm outline-none"
                    style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8', ...W }}
                  />
                  <button onClick={() => setMines((m) => Math.min(24, m + 1))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronUp className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {MINE_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMines(m)}
                    className="py-1.5 rounded-md text-xs transition-colors"
                    style={{ ...woodBtn(mines === m, 'rose'), ...W }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="GOLD" value={safe} />
              <StatBox label="MAX WIN" value={`${multiplierFor(safe, mines).toFixed(2)}x`} gold />
              <StatBox label="PAYOUT" value={`$${(bet * multiplierFor(safe, mines)).toFixed(2)}`} />
            </div>
          </WesternFrame>
        )}

        {/* Ticker while playing */}
        {phase === 'playing' && (
          <WesternFrame className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>CURRENT</p>
              <p className="text-xl text-amber-300 tabular-nums" style={W}>{currentMult.toFixed(2)}x</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>WIN</p>
              <p className="text-base text-amber-100 tabular-nums" style={W}>${Math.min(bet * pot, serverWinRef.current).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>NEXT</p>
              <p className="text-base text-amber-300 tabular-nums" style={W}>{nextMult.toFixed(2)}x</p>
            </div>
          </WesternFrame>
        )}

        {/* Action buttons */}
        {phase === 'playing' && (
          <button onClick={cashout} disabled={revealed.size === 0} className="w-full py-4 rounded-xl text-base font-black transition-all disabled:opacity-40" style={{ ...woodBtn(true), ...W }}>
            CASH OUT ${Math.min(bet * pot, serverWinRef.current).toFixed(2)}
          </button>
        )}
      </main>
      <GameDesktopPanel gameId="mines" title="Mines Rounds" />
    </div>
  );
}

function StatBox({ label, value, gold }) {
  return (
    <div className="rounded-lg py-2" style={{ border: '1px solid rgba(190,140,55,0.5)', background: 'rgba(20,13,6,0.85)' }}>
      <p className="text-[9px] tracking-widest text-amber-300/70" style={W}>{label}</p>
      <p className={`text-sm tabular-nums ${gold ? 'text-amber-300' : 'text-amber-100'}`} style={W}>{value}</p>
    </div>
  );
}

function GiftBox() {
  return (
    <div className="relative w-[72%] h-[62%] rounded-[3px] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
      <div className="grid grid-cols-5 h-full w-full">
        {GIFT_STRIPES.map((c) => (
          <div key={c} style={{ background: c }} />
        ))}
      </div>
      {/* vertical ribbon */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[22%]" style={{ background: 'linear-gradient(to bottom, #fff7d6, #ffd75a)', boxShadow: 'inset 0 0 0 1px rgba(120,80,10,0.4)' }} />
      {/* horizontal ribbon */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[22%]" style={{ background: 'linear-gradient(to right, #fff7d6, #ffd75a)', boxShadow: 'inset 0 0 0 1px rgba(120,80,10,0.4)' }} />
      {/* bow knot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] h-[26%] rounded-full" style={{ background: 'radial-gradient(circle, #ffe98a, #d6a21e)', boxShadow: '0 0 4px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

function GoldBar() {
  return (
    <div
      className="w-[72%] h-[52%] rounded-[3px] flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom, #fff3c4, #f0c850 45%, #b8801e)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,240,0.8), 0 0 8px rgba(255,210,120,0.55)',
        border: '1px solid rgba(90,60,15,0.55)',
      }}
    >
      <span className="text-[9px] tracking-widest text-[#5a3a0a]" style={{ fontFamily: 'Rye, Georgia, serif' }}>GOLD</span>
    </div>
  );
}

// Ornate carved-gold scroll flourish that frames each end of the bet button.
function GoldFlourish({ side = 'left' }) {
  const flip = side === 'right' ? 'scaleX(-1)' : 'none';
  return (
    <svg
      width="34"
      height="40"
      viewBox="0 0 34 40"
      style={{ position: 'absolute', top: '50%', transform: `translateY(-50%) ${flip}`, [side]: 0, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`gf-${side}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3d77a" />
          <stop offset="45%" stopColor="#c5a059" />
          <stop offset="100%" stopColor="#7a4f17" />
        </linearGradient>
      </defs>
      <g fill={`url(#gf-${side})`} stroke="#7a4f17" strokeWidth="0.6">
        {/* central scroll bracket */}
        <path d="M4 20 C4 10, 14 6, 20 10 C26 14, 26 26, 20 30 C14 34, 4 30, 4 20 Z" />
        {/* inner curl */}
        <path d="M9 20 C9 14, 16 12, 20 16 C24 20, 22 26, 18 27 C14 28, 11 25, 11 21 C11 18, 14 17, 16 18" fill="none" stroke="#7a4f17" strokeWidth="1.1" />
        {/* leaf tip */}
        <path d="M22 6 C26 2, 32 4, 33 9 C31 7, 26 7, 22 10 Z" />
        <path d="M22 34 C26 38, 32 36, 33 31 C31 33, 26 33, 22 30 Z" />
        {/* end bead */}
        <circle cx="6" cy="20" r="2.4" />
      </g>
    </svg>
  );
}