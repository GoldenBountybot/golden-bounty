import React, { useRef, useMemo } from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';

import ControlPanel from './ControlPanel';
import FreeSpinStart from './FreeSpinStart';
import FeatureBuyConfirm from './FeatureBuyConfirm';
import WesternFrame from './WesternFrame';
import PlaqueBanner from './PlaqueBanner';
import InfoBar from './InfoBar';
import BoardTopBanner from './BoardTopBanner';
import FlyingMultiplier from './FlyingMultiplier';
import CountUp from './CountUp';
import WbSuperWinBanner from './WbSuperWinBanner';
import WbMegaWinBanner from './WbMegaWinBanner';

export default function WildBountyMachine() {
  const g = useWildBounty();
  // The centre multiplier lights up while symbols are matching (and stays lit
  // showing the achieved tier until the next spin resets the round).
  const lit = g.winningPositions.size > 0 || g.cascading || g.shattering.size > 0 || g.lastWin > 0;

  // Measure the real pixel positions of the reel-board centre and the
  // win-banner centre relative to the machine — computed live each time a
  // multiplier is about to fly — so it holds dead-centre over the reels and
  // pops exactly on the win banner regardless of negative margins / layout.
  const machineRef = useRef(null);
  const boardRef = useRef(null);
  const winBannerRef = useRef(null);
  const topStripRef = useRef(null);
  const centerMultRef = useRef(null);

  // Measure anchor positions ONCE per flying-multiplier (keyed by its key) so
  // the many re-renders during a cascade / multiplier round don't force-layout
  // on every frame — the old per-render IIFE caused layout thrash → jank.
  const anchor = useMemo(() => {
    const fm = g.flyingMult;
    if (!fm) return null;
    const m = machineRef.current;
    if (!m) return null;
    const mb = m.getBoundingClientRect();
    const yOf = (el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2 - mb.top;
    };
    const hold = yOf(boardRef.current);
    const win = yOf(winBannerRef.current);
    const centerMult = yOf(centerMultRef.current);
    const strip = yOf(topStripRef.current);
    // Fly FROM the centre of the multiplier text on the top strip (not from
    // the top of the banner). Fall back to the strip centre, then to a little
    // above the board, if not measured yet.
    const startY = centerMult > 0 ? centerMult : (strip > 0 ? strip : Math.max(8, hold - mb.height * 0.4));
    return { startY, holdY: hold, winY: win };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.flyingMult?.key]);

  return (
    <div
      className="w-full mx-auto relative overflow-visible"
      ref={machineRef}
    >
      <div
        className="flex flex-col gap-2 overflow-hidden relative"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25cab1181_file_00000000b50c8230a0ebee9ef44b2ebe.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
{/* Decorative steer-skull banner on top of the board (black bg keyed out) */}
<div ref={topStripRef} className="flex justify-center mx-1 -mt-20 -mb-2 relative z-20 scale-110">
  <BoardTopBanner multIndex={g.multIndex} lit={lit} centerMultRef={centerMultRef} />
</div>

{/* Reel board — bronze western frame (web asset) around symbols */}
      <div
        ref={boardRef}
        className="relative mx-0 my-0 -mt-24"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c1acaec26_file_000000001de88211868a1e08115c5695.png)',
          backgroundSize: '108% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingTop: '7%',
          paddingBottom: '13%',
          paddingLeft: '0%',
          paddingRight: '0%',
        }}
      >


        {/* Grid — 24 cells (3-4-5-5-4-3), centered diamond */}
        <div className="grid grid-cols-6 gap-0 px-0 items-center mt-0 mb-0">
          {g.grid.map((reel, ri) => (
            <Reel
              key={ri}
              reelIndex={ri}
              rowCount={REEL_ROWS[ri]}
              symbols={reel}
              spinning={!g.stoppedReels.has(ri)}
              speed={g.anticipation && !g.stoppedReels.has(ri) ? (g.turbo ? 1.9 : 2.8) : (g.turbo ? 0.24 : 0.5)}
              anticipationGlow={g.anticipation && !g.stoppedReels.has(ri)}
              winningPositions={g.winningPositions}
              goldFrames={g.goldFrames}
              shatteringPositions={g.shattering}
              cascading={g.cascading}
              cascadePositions={g.cascadePositions}
              scatterGlow={g.scatterGlow}
              bulletHit={g.bulletHit}
              slow={g.cascadeSlow}
            />
          ))}
        </div>

        {/* FEATURE BUY banner — click to buy 10 free spins */}
        <button
          type="button"
          onClick={g.buyFeature}
          disabled={g.spinning || g.showFreeSpinStart || g.showFeatureBuyConfirm}
          className="absolute z-40 select-none active:scale-95 transition-transform disabled:opacity-70"
          style={{
            right: '-15px',
            bottom: '11%',
            width: '27%',
            maxWidth: '205px',
            minWidth: '106px',
            height: 'auto',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: (g.spinning || g.showFreeSpinStart) ? 'not-allowed' : 'pointer',
          }}
        >
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a422458cf_file_000000001fe0823080289c04ab45bfdf.png"
            alt="Feature Buy"
            className="block w-full h-auto"
            draggable={false}
          />
        </button>

      </div>

      {/* Win / message banner — shows a counting-up win amount while a round
          is paying, otherwise the status message */}
      <PlaqueBanner ref={winBannerRef} glow className="-mt-32 mx-auto py-1 text-center relative z-30 w-[94%]">
        <span
          className="wb-deep-gold text-lg sm:text-xl italic leading-none tracking-wide block w-full"
          style={{ fontFamily: 'Rye, Georgia, serif' }}
        >
          {g.lastWin > 0 ? <>WIN <CountUp value={g.lastWin} /></> : g.message}
        </span>
      </PlaqueBanner>

      {/* Free spins badge */}
      {g.freeSpins > 0 && (
        <WesternFrame glow className="flex items-center justify-center gap-1.5 py-1 mx-2">
          <span className="text-xs font-bold italic text-amber-200 tracking-[0.15em]" style={{ fontFamily: 'Rye, Georgia, serif' }}>
            ★ FREE SPINS: {g.freeSpins} ★
          </span>
        </WesternFrame>
      )}

      {/* Stats bar */}
      <div className="-mt-28 pb-8 relative z-40">
        <InfoBar balance={g.balance} bet={g.bet} win={g.lastWin} />

        {/* Controls */}
        <ControlPanel
          bet={g.bet}
          setBet={g.setBet}
          spinning={g.spinning}
          spin={g.spin}
          turbo={g.turbo}
          setTurbo={g.setTurbo}
          autoSpin={g.autoSpin}
          setAutoSpin={g.setAutoSpin}
        />
      </div>

      {g.showFreeSpinStart && !g.spinning && (
        <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />
      )}

      {g.showFeatureBuyConfirm && (
        <FeatureBuyConfirm
          cost={g.featureCost}
          onStart={g.confirmFeatureBuy}
          onCancel={g.cancelFeatureBuy}
        />
      )}

      </div>

      {/* Flying multiplier — overlays the whole machine so it can fly from the
          top banner all the way down into the win banner, then the win amount
          counts up in the banner */}
      {g.flyingMult && anchor && (
        <FlyingMultiplier
          key={g.flyingMult.key}
          value={g.flyingMult.value}
          slow={g.flyingMult.slow}
          startY={anchor.startY}
          holdY={anchor.holdY}
          winY={anchor.winY}
          onComplete={g.clearFlyingMult}
        />
      )}

      {g.superWin && (
        <WbSuperWinBanner
          amount={g.superWin.amount}
          multiplier={g.superWin.multiplier}
          onDone={g.dismissSuperWin}
        />
      )}

      {g.megaWin && (
        <WbMegaWinBanner
          amount={g.megaWin.amount}
          multiplier={g.megaWin.multiplier}
          onDone={g.dismissMegaWin}
        />
      )}

      {g.freeSpinsEndWin && (
        <WbMegaWinBanner
          amount={g.freeSpinsEndWin.amount}
          multiplier={g.freeSpinsEndWin.multiplier}
          onDone={g.dismissFreeSpinsEndWin}
        />
      )}
    </div>
  );
}