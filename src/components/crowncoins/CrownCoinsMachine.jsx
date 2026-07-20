import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { useToast } from '@/components/ui/use-toast';
import { SYMBOLS, JACKPOTS, spinGrid, evaluateGrid, runBonus, symbolByKey, cellValue, VALUE_COIN_IMG, JACKPOT_COINS, isValueCoin, valueCoinMult } from '@/lib/crownCoinsEngine';
import { playCoinSound } from '@/lib/crownCoinsSound';
import { Info, Zap, Plus, Minus, Play, RotateCw, Menu, DollarSign, X, Crown } from 'lucide-react';

// Falling-money backdrop used inside each reel strip so screen-blended symbols
// have a real backdrop to blend against even while the strip's transform
// animation isolates its stacking context during a spin.
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

function JackpotBadge({ tier, amount, color }) {
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
      <span className="text-[11px] font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${amount.toFixed(2)}</span>
    </div>
  );
}

// Dense 3D golden coin pile (transparent PNG) for the header centerpiece.
function CoinPile() {
  return (
    <img
      src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e53104d39_generated_image.png"
      alt="gold coin pile"
      className="absolute inset-0 w-full h-full object-contain"
      style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(255,200,80,0.45))' }}
    />
  );
}

function Tile({ symKey, win, dim, bet }) {
  const isCoin = symKey === 'coin';
  const isVC = isValueCoin(symKey);
  const s = isVC ? null : (symbolByKey(symKey) || SYMBOLS[0]);
  const vcVal = isVC ? valueCoinMult(symKey) * bet : 0;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden p-[3px]"
      style={{
        background: 'transparent',
        border: win ? '2px solid #ffd24a' : '1px solid rgba(212,175,55,0.35)',
        boxShadow: win
          ? '0 0 12px rgba(255,210,80,0.9), inset 0 0 0 2px rgba(255,235,150,0.9)'
          : 'none',
        opacity: dim ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[2px]"
        style={{ background: 'transparent' }}
      >
        {isVC ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={VALUE_COIN_IMG} alt="coin" className="w-full h-full object-contain" draggable={false} style={{ mixBlendMode: 'screen' }} />
            <span className="absolute font-black text-yellow-100" style={{ fontSize: '10px', textShadow: '0 1px 2px #000, 0 0 3px rgba(0,0,0,0.85)', fontFamily: 'Georgia, serif' }}>${vcVal.toFixed(2)}</span>
          </div>
        ) : (
          <img
            src={s.image}
            alt={s.name}
            className="w-full h-full object-cover"
            draggable={false}
            style={{ mixBlendMode: 'screen' }}
          />
        )}
        {win && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 12px rgba(255,220,120,0.8)', background: 'radial-gradient(circle at center, rgba(255,235,150,0.25), transparent 70%)' }}
          />
        )}
      </div>
    </div>
  );
}

// A single reel column — wild-bounty style: continuous downward reelFall loop
// while spinning (seamless because last block == first block, so no blur needed),
// then a reelLand bounce when it stops.
function ReelColumn({ result, phase, winMask, speed, bet }) {
  // result: 3 keys (top, mid, bottom). phase: 'idle' | 'spin' | 'land'
  const [spinStrip, setSpinStrip] = useState(() => [...result]);

  useEffect(() => {
    if (phase === 'spin') {
      const r = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].key;
      const b0 = [r(), r(), r()];
      // 4 blocks of 3; last block == first block → seamless -75%→0 loop
      setSpinStrip([...b0, r(), r(), r(), r(), r(), r(), ...b0]);
    }
  }, [phase]);

  const showResult = phase !== 'spin';
  const strip = showResult ? [...result] : spinStrip;

  const anim =
    phase === 'spin'
      ? `reelFall ${speed}s linear infinite`
      : phase === 'land'
      ? 'reelLand 0.4s ease-out'
      : 'none';

  return (
    <div className="relative flex-1 overflow-hidden" style={{ aspectRatio: '1 / 3.4', background: 'transparent' }}>
      <div className="flex flex-col w-full" style={{ animation: anim, willChange: phase === 'spin' ? 'transform' : 'auto', backgroundImage: `url(${MONEY_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {strip.map((k, i) => (
          <div key={i} style={{ width: '100%', aspectRatio: '1 / 1' }}>
            <Tile symKey={k} win={showResult && winMask[i]} dim={showResult && winMask.some(Boolean) && !winMask[i]} bet={bet} />
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

  // grid stored as 9 keys row-major; reels = 3 columns each 3 rows
  const [reels, setReels] = useState(() => [
    ['lemon', 'bell', 'plum'],
    ['watermelon', 'bar', 'cherry'],
    ['seven', 'plum', 'orange'],
  ]);
  const [phases, setPhases] = useState(['idle', 'idle', 'idle']);
  const [spinning, setSpinning] = useState(false);
  const [winMask, setWinMask] = useState(() => [[false, false, false], [false, false, false], [false, false, false]]);
  const [lastWin, setLastWin] = useState(0);
  const [bet, setBet] = useState(1);
  const [bonus, setBonus] = useState(null);
  const [revealStep, setRevealStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const timers = useRef([]);
  const autoRef = useRef(false);
  const reelsRef = useRef(null);
  const bannerRef = useRef(null);
  const [flyCoins, setFlyCoins] = useState([]);

  const clearTimers = () => { timers.current.forEach(t => clearTimeout(t)); timers.current = []; };

  useEffect(() => () => clearTimers(), []);

  const doSpin = useCallback(async () => {
    if (spinning) return;
    if (bet <= 0) { toast({ title: 'Set a bet amount' }); return; }
    if (balance < bet) { toast({ title: 'Insufficient balance' }); autoRef.current = false; setAutoSpin(false); return; }
    setSpinning(true);
    setWinMask([[false,false,false],[false,false,false],[false,false,false]]);
    setLastWin(0);
    setBalance(b => Math.max(0, b - bet));
    clearTimers();

    // compute final result
    const resultGrid = spinGrid(rtp); // 9 keys row-major
    const cols = [
      [resultGrid[0], resultGrid[3], resultGrid[6]],
      [resultGrid[1], resultGrid[4], resultGrid[7]],
      [resultGrid[2], resultGrid[5], resultGrid[8]],
    ];

    // start all reels spinning
    setReels(cols);
    setPhases(['spin', 'spin', 'spin']);

    const base = turbo ? 420 : 720;
    const step = turbo ? 160 : 260;
    const landMs = 460;

    // staggered land per reel
    cols.forEach((col, i) => {
      const t1 = setTimeout(() => {
        setPhases(prev => prev.map((p, idx) => (idx === i ? 'land' : p)));
      }, base + i * step);
      timers.current.push(t1);
    });

    // after the last reel lands, settle + evaluate
    const settleAt = base + 2 * step + landMs;
    const tEnd = setTimeout(async () => {
      setPhases(['idle', 'idle', 'idle']);

      const { lines, totalMul, coins, scatterMul } = evaluateGrid(resultGrid);
      let win = totalMul * (bet / 5) + scatterMul * bet;

      // build win mask per reel (which rows are part of a winning line)
      const mask = cols.map(() => [false, false, false]);
      lines.forEach(ln => {
        ln.idxs.forEach(idx => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          mask[col][row] = true;
        });
      });
      setWinMask(mask);

      let bonusResult = null;
      if (coins >= 3) {
        bonusResult = runBonus(bet, rtp);
        win += bonusResult.total;
      }

      if (win > 0) setBalance(b => b + win);
      setLastWin(win);
      setSpinning(false);

      // Value coins fly to the Crown Coins banner — visual + sound only, no balance change.
      if (reelsRef.current && bannerRef.current) {
        const rc = reelsRef.current.getBoundingClientRect();
        const bc = bannerRef.current.getBoundingClientRect();
        const cellW = rc.width / 3, cellH = rc.height / 3;
        const coins = [];
        resultGrid.forEach((k, i) => {
          if (isValueCoin(k)) {
            const col = i % 3, row = Math.floor(i / 3);
            const fx = rc.left + (col + 0.5) * cellW;
            const fy = rc.top + (row + 0.5) * cellH;
            coins.push({ id: i + '-' + Date.now(), fx, fy, dx: bc.left + bc.width / 2 - fx, dy: bc.top + bc.height / 2 - fy, mult: valueCoinMult(k) });
          }
        });
        if (coins.length) {
          setFlyCoins(coins);
          coins.forEach((c, idx) => { const t = setTimeout(() => playCoinSound(), idx * 130); timers.current.push(t); });
          const tClear = setTimeout(() => setFlyCoins([]), 1100);
          timers.current.push(tClear);
        }
      }
      if (bonusResult) { setBonus(bonusResult); setRevealStep(0); autoRef.current = false; setAutoSpin(false); }
      logActivity('crown-coins', bet, win, win > 0 ? 'win' : 'loss');
      try { base44.analytics.track({ eventName: 'crown_coins_spin', properties: { bet, win: Math.round(win * 100) / 100, coins } }); } catch {}

      if (autoRef.current && !bonusResult) {
        const tAuto = setTimeout(() => { if (autoRef.current) doSpin(); }, 500);
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

  const closeBonus = () => { setBonus(null); setRevealStep(0); };
  const revealAll = () => setRevealStep(9);

  const BET_LADDER = [0.05, 0.10, 0.20, 0.30, 0.50, 0.80, 1.00, 1.50, 2.00, 3.00, 5.00, 10.00, 20.00, 50.00, 100.00, 200.00, 500.00];
  const stepTo = (dir) => setBet(b => {
    const cap = maxBet || 500;
    let idx = BET_LADDER.findIndex(v => Math.abs(v - b) < 0.001);
    if (idx < 0) {
      // snap to nearest ladder value not exceeding current
      idx = BET_LADDER.reduce((best, v, i) => (v <= b + 0.001 ? i : best), 0);
    }
    const next = Math.max(0, Math.min(BET_LADDER.length - 1, idx + dir));
    let val = BET_LADDER[next];
    if (val > cap) val = BET_LADDER.filter(v => v <= cap).pop() || 0.05;
    return val;
  });
  const decBet = () => stepTo(-1);
  const incBet = () => stepTo(1);

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
            <JackpotBadge {...JACKPOTS[0]} />
            <JackpotBadge {...JACKPOTS[1]} />
          </div>

          <div ref={bannerRef} className="flex-1 flex items-center justify-center">
            <img
              src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d353befdc_generated_image.png"
              alt="Crown Coins"
              className="w-[78%]"
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
            />
          </div>

          <div className="flex flex-col gap-1 justify-center w-[20%]">
            <JackpotBadge {...JACKPOTS[2]} />
            <JackpotBadge {...JACKPOTS[3]} />
          </div>
        </div>

        <div
          className="relative rounded-lg p-1.5 overflow-hidden"
          style={{
            border: '3px solid #d4af37',
            boxShadow: 'inset 0 2px 6px rgba(255,235,150,0.4), inset 0 0 0 2px #8a5a00, 0 4px 14px rgba(0,0,0,0.6)',
            background: 'linear-gradient(to bottom, #b8860b, #6b4a08)',
          }}
        >
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f28be6c98_.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
            style={{ opacity: 1 }}
          />
          <div ref={reelsRef} className="relative flex gap-0.5 rounded-md overflow-hidden" style={{ background: 'transparent' }}>
            {reels.map((col, i) => (
              <ReelColumn key={i} result={col} phase={phases[i]} winMask={winMask[i]} speed={turbo ? 0.24 : 0.5} bet={bet} />
            ))}
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
          <button onClick={decBet} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={doSpin}
            disabled={spinning || sLoading}
            className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-60"
            style={{
              background: 'radial-gradient(circle at center, #fff2c0 0%, #e8a93a 55%, #b8860b 100%)',
              boxShadow: '0 0 18px rgba(255,210,80,0.8), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 0 0 2px #8a5a00',
            }}
          >
            {spinning ? <RotateCw className="w-7 h-7 text-stone-900 animate-spin" /> : <Play className="w-7 h-7 text-stone-900 ml-1" />}
          </button>

          <button onClick={incBet} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={toggleAuto} className={`w-9 h-9 rounded-full flex items-center justify-center border ${autoSpin ? 'border-yellow-400 text-yellow-300 bg-yellow-500/20' : 'border-white/40 text-white/80 bg-black/30'}`}>
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] font-bold tracking-widest text-yellow-200/80">{spinning ? 'GOOD LUCK!' : 'PLACE YOUR BET'}</p>

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
                    <span className="text-[10px] text-yellow-300/80" style={{ fontFamily: 'Georgia, serif' }}>{s.bonus ? '3+ → Royal Treasury' : `${s.pay}× line`}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-yellow-200/70 italic text-center">5 fixed lines · 3-of-a-kind pays · 3+ Crown Coins trigger the Royal Treasury bonus</p>
          </div>
        </div>
      )}

      {bonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
            <button onClick={closeBonus} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100"><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-300" />
              <h3 className="text-lg font-black text-yellow-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>Royal Treasury</h3>
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-center text-[10px] text-yellow-200/70 italic mb-3">{bonus.royal ? 'Royal Coin ×1.5 boost active!' : 'Tap coins to reveal the treasury'}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {bonus.cells.map((cell, i) => {
                const revealed = revealStep > i;
                const isJackpot = cell.type === 'jackpot';
                const isRoyal = i >= 6;
                const coinImg = isJackpot ? JACKPOT_COINS[cell.tier] : VALUE_COIN_IMG;
                const val = cellValue(cell, bet);
                return (
                  <div
                    key={i}
                    onClick={() => setRevealStep(s => Math.max(s, i + 1))}
                    className="aspect-square flex items-center justify-center rounded-md cursor-pointer relative overflow-hidden"
                    style={{
                      border: `2px solid ${revealed ? (isJackpot ? '#ffd24a' : isRoyal ? '#e8c873' : '#d4af37') : 'rgba(190,140,55,0.35)'}`,
                      background: revealed ? (isJackpot ? 'linear-gradient(135deg,#7a0e1c,#2a0408)' : isRoyal ? 'linear-gradient(135deg,#7a5210,#2a1a06)' : 'linear-gradient(135deg,#4a3416,#211608)') : 'rgba(0,0,0,0.4)',
                      boxShadow: revealed && (isJackpot || isRoyal) ? '0 0 12px rgba(255,210,80,0.75)' : revealed ? '0 0 8px rgba(255,210,80,0.5)' : 'none',
                    }}
                  >
                    {revealed ? (
                      <div className="relative flex flex-col items-center justify-center w-full h-full">
                        <img src={coinImg} alt={isJackpot ? cell.tier : 'coin'} className="w-12 h-12 object-contain" style={{ mixBlendMode: 'screen' }} />
                        {isJackpot ? (
                          <span className="text-[10px] font-black text-yellow-300 mt-0.5" style={{ fontFamily: 'Rye, Georgia, serif' }}>{cell.tier}</span>
                        ) : (
                          <span className="text-[11px] font-black text-yellow-100 -mt-1" style={{ fontFamily: 'Georgia, serif' }}>${val.toFixed(2)}</span>
                        )}
                      </div>
                    ) : (
                      <img src={VALUE_COIN_IMG} alt="?" className="w-12 h-12 object-contain opacity-30" style={{ mixBlendMode: 'screen' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button onClick={revealAll} className="px-3 py-1.5 rounded-md border border-yellow-700/50 text-yellow-100 text-xs font-bold italic" style={{ fontFamily: 'Georgia, serif', background: 'rgba(0,0,0,0.4)' }}>Reveal All</button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-yellow-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>Total</span>
                <span className="text-xl font-black text-emerald-300 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bonus.total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={closeBonus} className="mt-3 w-full py-2 rounded-lg text-stone-950 font-black italic" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)' }}>Collect</button>
          </div>
        </div>
      )}

      {flyCoins.map(c => (
        <div key={c.id} className="absolute pointer-events-none" style={{ left: c.fx, top: c.fy, animation: 'ccCoinFly 0.9s ease-in forwards', '--dx': c.dx + 'px', '--dy': c.dy + 'px' }}>
          <div className="relative w-9 h-9 flex items-center justify-center">
            <img src={VALUE_COIN_IMG} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'screen' }} />
            <span className="absolute font-black text-yellow-100" style={{ fontSize: '8px', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}>${(c.mult * bet).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}