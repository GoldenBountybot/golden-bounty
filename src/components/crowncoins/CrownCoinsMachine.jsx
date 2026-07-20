import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { useToast } from '@/components/ui/use-toast';
import {
  SYMBOLS, LINE_SYMBOLS, symbolByKey, spinGrid, evaluateGrid, isBonusTrigger, runBonus, JACKPOTS,
} from '@/lib/crownCoinsEngine';

import RoyalTreasuryBanner from './RoyalTreasuryBanner';
import RoyalTreasuryBonus from './RoyalTreasuryBonus';
import GambleGame from './GambleGame';
import { Info, Zap, Plus, Minus, Play, RotateCw, Menu, DollarSign, X, Crown, Spade } from 'lucide-react';

const MONEY_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f28be6c98_.jpg';

const DiamondBG = (
  <div
    className="absolute inset-0 -z-10"
    style={{ background: 'radial-gradient(ellipse at center, #a01828 0%, #7a0e1c 45%, #4a0008 100%)' }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 18px)',
      }}
    />
  </div>
);

function JackpotBadge({ tier, mult, color, bet }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg px-2 py-1 w-full"
      style={{
        border: '2px solid #d4af37',
        background: `linear-gradient(to bottom, ${color}, rgba(0,0,0,0.5))`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 3px rgba(0,0,0,0.6)',
      }}
    >
      <span className="text-[9px] font-black tracking-wider text-yellow-300" style={{ fontFamily: 'Georgia, serif' }}>{tier}</span>
      <span className="text-[11px] font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${(mult * bet).toFixed(2)}</span>
    </div>
  );
}

function Tile({ symKey, win, dim, amount }) {
  const s = symbolByKey(symKey) || SYMBOLS[0];
  const isCoin = symKey === 'coin';
  const isWild = symKey === 'wild';
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden p-[3px]"
      style={{
        border: win ? '2px solid #ffd24a' : '1px solid rgba(212,175,55,0.35)',
        boxShadow: win ? '0 0 12px rgba(255,210,80,0.9), inset 0 0 0 2px rgba(255,235,150,0.9)' : 'none',
        opacity: dim ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[2px]" style={{ background: 'transparent' }}>
        <img
          src={s.image}
          alt={s.name}
          className="w-full h-full object-cover"
          draggable={false}
          style={{
            mixBlendMode: 'screen',
            filter: isWild ? 'drop-shadow(0 0 8px rgba(255,210,80,0.85))' : isCoin ? 'drop-shadow(0 0 10px rgba(255,200,80,0.9))' : 'none',
          }}
        />
        {win && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 12px rgba(255,220,120,0.8)', background: 'radial-gradient(circle at center, rgba(255,235,150,0.25), transparent 70%)' }}
          />
        )}
        {amount != null && (
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 3.4vw, 16px)',
              color: '#ff1a1a',
              textShadow: '0 0 3px #fff, 0 0 6px rgba(255,255,255,0.9), 0 1px 2px #000',
              animation: 'saWinPop 0.35s ease-out',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            ${Number(amount).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

function ReelColumn({ result, phase, winMask, speed, colIndex, amountCell }) {
  const [spinStrip, setSpinStrip] = useState(() => [...result]);

  useEffect(() => {
    if (phase === 'spin') {
      const keys = LINE_SYMBOLS.map(s => s.key);
      const r = () => keys[Math.floor(Math.random() * keys.length)];
      const b0 = [r(), r(), r()];
      setSpinStrip([...b0, r(), r(), r(), r(), r(), r(), ...b0]);
    }
  }, [phase]);

  const showResult = phase !== 'spin';
  const strip = showResult ? [...result] : spinStrip;
  const anim =
    phase === 'spin' ? `reelFall ${speed}s linear infinite`
      : phase === 'land' ? 'reelLand 0.4s ease-out'
      : 'none';

  return (
    <div className="relative flex-1 overflow-hidden" style={{ aspectRatio: '1 / 3', background: 'transparent' }}>
      <div className="flex flex-col w-full" style={{ animation: anim, willChange: phase === 'spin' ? 'transform' : 'auto', backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${MONEY_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {strip.map((k, i) => (
          <div key={i} style={{ width: '100%', aspectRatio: '1 / 1' }}>
            <Tile symKey={k} win={showResult && winMask[i]} dim={showResult && winMask.some(Boolean) && !winMask[i]} amount={amountCell && amountCell.col === colIndex && amountCell.row === i ? amountCell.amount : null} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CrownCoinsMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp, loading: sLoading, minBet, maxBet } = useGameSettings('crown-coins');
  const logActivity = useLogActivity();
  const { toast } = useToast();

  const [reels, setReels] = useState(() => [
    ['cherry', 'bell', 'plum'],
    ['watermelon', 'bar', 'cherry'],
    ['seven', 'plum', 'orange'],
  ]);
  const [phases, setPhases] = useState(['idle', 'idle', 'idle']);
  const [spinning, setSpinning] = useState(false);
  const [winMask, setWinMask] = useState(() => [[false, false, false], [false, false, false], [false, false, false]]);
  const [lastWin, setLastWin] = useState(0);
  const [pendingWin, setPendingWin] = useState(0); // bankable win available to gamble
  const [amountCell, setAmountCell] = useState(null);
  const [bet, setBet] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turbo, setTurbo] = useState(false);

  // Bonus + banner
  const [bonusPending, setBonusPending] = useState(null);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [showRoyalBanner, setShowRoyalBanner] = useState(false);
  const [royalWin, setRoyalWin] = useState(null);
  const [triggerGlow, setTriggerGlow] = useState(false);

  // Gamble
  const [gambleOpen, setGambleOpen] = useState(false);
  const [gambleStake, setGambleStake] = useState(0);

  const timers = useRef([]);
  const autoRef = useRef(false);
  const clearTimers = () => { timers.current.forEach(t => clearTimeout(t)); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const doSpin = useCallback(async () => {
    if (spinning) return;
    if (bet <= 0) { toast({ title: 'Set a bet amount' }); return; }
    if (balance < bet) { toast({ title: 'Insufficient balance' }); autoRef.current = false; setAutoSpin(false); return; }

    // Clear any pending/bankable win from the previous spin.
    setPendingWin(0);
    setSpinning(true);
    setWinMask([[false, false, false], [false, false, false], [false, false, false]]);
    setLastWin(0);
    setAmountCell(null);
    setTriggerGlow(false);
    setBalance(b => Math.max(0, b - bet));
    clearTimers();

    const resultGrid = spinGrid(rtp);
    const cols = [
      [resultGrid[0], resultGrid[3], resultGrid[6]],
      [resultGrid[1], resultGrid[4], resultGrid[7]],
      [resultGrid[2], resultGrid[5], resultGrid[8]],
    ];
    setReels(cols);
    setPhases(['spin', 'spin', 'spin']);

    const base = turbo ? 420 : 720;
    const step = turbo ? 160 : 260;
    const landMs = 460;

    cols.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setPhases(prev => prev.map((p, idx) => (idx === i ? 'land' : p)));
      }, base + i * step);
      timers.current.push(t1);
    });

    const settleAt = base + 2 * step + landMs;
    const tEnd = setTimeout(() => {
      setPhases(['idle', 'idle', 'idle']);

      // Bonus trigger: 3 Crown Coins on reel 2.
      if (isBonusTrigger(resultGrid)) {
        const mask = cols.map(() => [false, false, false]);
        mask[1][0] = mask[1][1] = mask[1][2] = true;
        setWinMask(mask);
        setTriggerGlow(true);
        const tGlow = setTimeout(() => setTriggerGlow(false), 1300);
        timers.current.push(tGlow);
        setBonusPending(runBonus(bet, rtp));
        setRoyalWin(null);
        setShowRoyalBanner(true);
        setSpinning(false);
        logActivity('crown-coins', bet, 0, 'push');
        try { base44.analytics.track({ eventName: 'crown_coins_bonus_trigger', properties: { bet } }); } catch {}
        return;
      }

      const { lines, totalMul } = evaluateGrid(resultGrid);
      const win = +(totalMul * (bet / 5)).toFixed(2);

      const mask = cols.map(() => [false, false, false]);
      lines.forEach(ln => ln.idxs.forEach(idx => {
        const col = idx % 3, row = Math.floor(idx / 3);
        mask[col][row] = true;
      }));
      setWinMask(mask);

      if (win > 0) setBalance(b => +(b + win).toFixed(2));
      setLastWin(win);
      setPendingWin(win);
      setSpinning(false);

      if (win > 0 && lines.length) {
        let first = null;
        for (let c = 0; c < 3 && !first; c++) for (let r = 0; r < 3 && !first; r++) if (mask[c][r]) first = { col: c, row: r };
        if (first) setAmountCell({ ...first, amount: win });
      }

      logActivity('crown-coins', bet, win, win > 0 ? 'win' : 'loss');
      try { base44.analytics.track({ eventName: 'crown_coins_spin', properties: { bet, win } }); } catch {}

      if (autoRef.current) {
        const delay = win > 0 ? 1200 : 500; // longer on a win so the player can Risk
        const tAuto = setTimeout(() => { if (autoRef.current) doSpin(); }, delay);
        timers.current.push(tAuto);
      }
    }, settleAt);
    timers.current.push(tEnd);
  }, [spinning, bet, balance, rtp, turbo, setBalance, logActivity, toast]);

  const toggleAuto = () => {
    const next = !autoSpin;
    setAutoSpin(next);
    autoRef.current = next;
    if (next && !spinning) doSpin();
  };

  // Royal Treasury banner handles both intro (open bonus) and outro (collect).
  const continueRoyalBanner = () => {
    if (royalWin != null) {
      setRoyalWin(null);
      setShowRoyalBanner(false);
      if (autoRef.current) {
        const t = setTimeout(() => { if (autoRef.current) doSpin(); }, 400);
        timers.current.push(t);
      }
    } else {
      setShowRoyalBanner(false);
      setBonusOpen(true);
    }
  };

  const collectBonus = (total) => {
    setBonusOpen(false);
    setBonusPending(null);
    if (total > 0) setBalance(b => +(b + total).toFixed(2));
    setRoyalWin(total);
    setShowRoyalBanner(true);
    try { base44.analytics.track({ eventName: 'crown_coins_bonus_collect', properties: { total } }); } catch {}
  };

  const openGamble = () => {
    if (pendingWin <= 0) return;
    const stake = pendingWin;
    setBalance(b => +Math.max(0, b - stake).toFixed(2)); // stake the win into the gamble pot
    setGambleStake(stake);
    setPendingWin(0);
    setGambleOpen(true);
  };
  const onGambleCollect = (amount) => {
    setGambleOpen(false);
    if (amount > 0) setBalance(b => +(b + amount).toFixed(2));
    setGambleStake(0);
  };
  const closeGamble = () => {
    setGambleOpen(false);
    setGambleStake(0);
  };

  const BET_LADDER = [0.05, 0.10, 0.20, 0.30, 0.50, 0.80, 1.00, 1.50, 2.00, 3.00, 5.00, 10.00, 20.00, 50.00, 80.00, 100.00, 200.00, 500.00];
  const stepTo = (dir) => setBet(b => {
    const cap = maxBet || 500;
    let idx = BET_LADDER.findIndex(v => Math.abs(v - b) < 0.001);
    if (idx < 0) idx = BET_LADDER.reduce((best, v, i) => (v <= b + 0.001 ? i : best), 0);
    const next = Math.max(0, Math.min(BET_LADDER.length - 1, idx + dir));
    let val = BET_LADDER[next];
    if (val > cap) val = BET_LADDER.filter(v => v <= cap).pop() || 0.05;
    return val;
  });

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {DiamondBG}

      <div className="max-w-lg mx-auto px-3 pt-2 pb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowInfo(true)} className="w-7 h-7 rounded-full border border-white/70 flex items-center justify-center text-white/90 bg-black/20">
            <Info className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold tracking-widest text-yellow-300/80" style={{ fontFamily: 'Georgia, serif' }}>CROWN COINS</span>
          <span className="w-7" />
        </div>

        <div className="flex items-stretch gap-2">
          <div className="flex flex-col gap-1 justify-center w-[20%]">
            <JackpotBadge {...JACKPOTS[0]} bet={bet} />
            <JackpotBadge {...JACKPOTS[1]} bet={bet} />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <img
              src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d353befdc_generated_image.png"
              alt="Crown Coins"
              className="w-[78%]"
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
            />
          </div>
          <div className="flex flex-col gap-1 justify-center w-[20%]">
            <JackpotBadge {...JACKPOTS[2]} bet={bet} />
            <JackpotBadge {...JACKPOTS[3]} bet={bet} />
          </div>
        </div>

        <div
          className="relative rounded-lg p-1 overflow-hidden"
          style={{
            border: '2px solid #d4af37',
            boxShadow: 'inset 0 2px 6px rgba(255,235,150,0.4), inset 0 0 0 1px #8a5a00, 0 4px 14px rgba(0,0,0,0.6)',
            background: 'linear-gradient(to bottom, #b8860b, #6b4a08)',
          }}
        >
          <img src={MONEY_BG} alt="" className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none" />
          <div className="relative flex gap-0.5 rounded-md overflow-hidden" style={{ background: 'transparent' }}>
            {reels.map((col, i) => (
              <ReelColumn key={i} result={col} phase={phases[i]} winMask={winMask[i]} speed={turbo ? 0.24 : 0.5} colIndex={i} amountCell={amountCell} />
            ))}
            {triggerGlow && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-30" style={{ gap: '2px' }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center">
                    {(i === 1 || i === 4 || i === 7) && (
                      <div className="w-full h-full rounded-[2px]" style={{ animation: 'ccTriggerGlow 1.3s ease-out' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">BET</div>
            <div className="text-xs font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bet.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">LAST WIN</div>
            <div className={`text-xs font-black tabular-nums ${lastWin > 0 ? 'text-emerald-300' : 'text-white/60'}`} style={{ fontFamily: 'Georgia, serif' }}>${lastWin.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">FIXED LINES</div>
            <div className="text-xs font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>5</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 py-1">
          <button onClick={() => setTurbo(t => !t)} className={`w-9 h-9 rounded-full flex items-center justify-center border ${turbo ? 'border-yellow-400 text-yellow-300 bg-yellow-500/20' : 'border-white/40 text-white/80 bg-black/30'}`}>
            <Zap className="w-5 h-5" />
          </button>
          <button onClick={() => stepTo(-1)} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Minus className="w-6 h-6" />
          </button>
          <button
            onClick={doSpin}
            disabled={spinning || sLoading || bonusOpen}
            className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-60"
            style={{ background: 'radial-gradient(circle at center, #fff2c0 0%, #e8a93a 55%, #b8860b 100%)', boxShadow: '0 0 18px rgba(255,210,80,0.8), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 0 0 2px #8a5a00' }}
          >
            {spinning ? <RotateCw className="w-7 h-7 text-stone-900 animate-spin" /> : <Play className="w-7 h-7 text-stone-900 ml-1" />}
          </button>
          <button onClick={() => stepTo(1)} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={toggleAuto} className={`w-9 h-9 rounded-full flex items-center justify-center border ${autoSpin ? 'border-yellow-400 text-yellow-300 bg-yellow-500/20' : 'border-white/40 text-white/80 bg-black/30'}`}>
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            onClick={openGamble}
            disabled={spinning || pendingWin <= 0}
            className="px-3 py-1.5 rounded-md border border-yellow-600/60 text-yellow-100 text-xs font-bold italic disabled:opacity-40 flex items-center gap-1"
            style={{ fontFamily: 'Georgia, serif', background: 'rgba(0,0,0,0.4)' }}
          >
            <Spade className="w-3.5 h-3.5" /> Risk ${pendingWin.toFixed(2)}
          </button>
          <p className="text-center text-[10px] font-bold tracking-widest text-yellow-200/80">{spinning ? 'GOOD LUCK!' : (pendingWin > 0 ? 'WIN — RISK OR SPIN' : 'PLACE YOUR BET')}</p>
          <span className="w-[88px]" />
        </div>

        <div className="flex items-center justify-between px-1">
          <button className="w-8 h-8 flex items-center justify-center text-white/80"><Menu className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-yellow-300/70 font-bold tracking-wider">BALANCE</span>
            <span className="text-sm font-black text-yellow-200 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${balance.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-yellow-300/70 font-bold tracking-wider">CURRENCY</span>
            <span className="text-xs font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>USD</span>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center border border-yellow-600/50 text-yellow-200 bg-black/40">
            <DollarSign className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
            <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-black text-yellow-300 mb-2" style={{ fontFamily: 'Rye, Georgia, serif' }}>Paytable</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SYMBOLS.map(s => (
                <div key={s.key} className="flex items-center gap-2 rounded-md p-1.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <img src={s.image} alt={s.name} className="w-9 h-9 object-cover rounded" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>{s.name}</span>
                    <span className="text-[10px] text-yellow-300/80" style={{ fontFamily: 'Georgia, serif' }}>
                      {s.special ? '3 on reel 2 → Royal Treasury' : s.wild ? `${s.pay}× bet · Wild` : `${s.pay}× line`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-black text-yellow-300 mb-1.5 tracking-wider" style={{ fontFamily: 'Rye, Georgia, serif' }}>JACKPOT COINS</div>
              <div className="grid grid-cols-2 gap-1.5">
                {JACKPOTS.map(j => (
                  <div key={j.tier} className="flex items-center gap-2 rounded-md p-1.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: j.color }}>{j.tier[0]}</span>
                    <span className="text-[11px] font-black text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>{j.tier} · {j.mult}× bet</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[10px] text-yellow-200/70 italic text-center">5 fixed lines · 3-of-a-kind with Wild substitution · 3 Crown Coins on reel 2 trigger Royal Treasury · Risk game doubles wins up to 10×</p>
          </div>
        </div>
      )}

      {bonusOpen && bonusPending && (
        <RoyalTreasuryBonus spins={bonusPending.spins} total={bonusPending.total} bet={bet} onCollect={collectBonus} />
      )}

      {showRoyalBanner && <RoyalTreasuryBanner onContinue={continueRoyalBanner} winAmount={royalWin} />}

      {gambleOpen && (
        <GambleGame stake={gambleStake} onCollect={onGambleCollect} onClose={closeGamble} />
      )}
    </div>
  );
}