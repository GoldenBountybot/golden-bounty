// Temporary on-screen diagnostics for the Telegram fullscreen + native back
// button issue. Renders ONLY inside Telegram: a small "?" button opens a live
// panel showing what the current client actually supports, with buttons to
// trigger the fullscreen / back-button APIs by hand so failures are visible.
import { useState, useEffect } from 'react';
import { tgWebApp, isInsideTelegram } from '@/lib/telegram';

export default function TgDebugPanel() {
  const [wa, setWa] = useState(null);
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const [log, setLog] = useState([]);
  const add = (s) => setLog((l) => [...l.slice(-4), s]);

  useEffect(() => {
    const w = tgWebApp();
    if (!w || !isInsideTelegram()) return;
    setWa(w);
    const bump = () => setTick((t) => t + 1);
    const handlers = {
      fullscreenChanged: () => { add('fullscreenChanged, isFullscreen=' + !!w.isFullscreen); bump(); },
      fullscreenFailed: (e) => { add('fullscreenFailed: ' + JSON.stringify(e?.error ?? e ?? null)); bump(); },
      backButtonClicked: () => { add('backButtonClicked fired'); bump(); },
    };
    const events = Object.keys(handlers);
    events.forEach((ev) => { try { w.onEvent?.(ev, handlers[ev]); } catch { /* old client */ } });
    return () => events.forEach((ev) => { try { w.offEvent?.(ev, handlers[ev]); } catch { /* noop */ } });
  }, []);

  if (!wa) return null;

  const tryFn = (label, fn) => {
    try {
      fn();
      add(label + ': called OK');
    } catch (e) {
      add(label + ': ERROR ' + (e?.message || e));
    }
    setTick((t) => t + 1);
  };

  let ver8 = 'err';
  try { ver8 = wa.isVersionAtLeast?.('8.0'); } catch { /* keep 'err' */ }

  return (
    <div className="fixed top-2 right-2 z-[9998] text-[10px] font-mono">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-6 h-6 rounded-full bg-black/70 text-white/80 border border-white/30"
          aria-label="Open Telegram debug panel"
        >
          ?
        </button>
      ) : (
        <div className="bg-black/85 border border-white/25 rounded-lg p-2 text-white/90 max-w-[240px] leading-snug space-y-0.5">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-[11px]">TG Debug</span>
            <button onClick={() => setOpen(false)} className="px-1.5 text-white/60 text-xs">&#215;</button>
          </div>
          <div>platform: {String(wa.platform)}</div>
          <div>version: {String(wa.version)}</div>
          <div>API 8.0+: {ver8 === true ? 'yes' : ver8 === false ? 'NO' : String(ver8)}</div>
          <div>requestFullscreen: {typeof wa.requestFullscreen}</div>
          <div>isFullscreen: {String(!!wa.isFullscreen)}</div>
          <div>BackButton: {wa.BackButton ? 'yes' : 'NO'}</div>
          <div className="flex gap-1 pt-1">
            <button
              onClick={() => tryFn('requestFullscreen', () => wa.requestFullscreen?.())}
              className="px-1.5 py-0.5 bg-yellow-600 rounded text-[10px] text-white"
            >
              Fullscreen
            </button>
            <button
              onClick={() => tryFn('BackButton.show', () => wa.BackButton?.show?.())}
              className="px-1.5 py-0.5 bg-yellow-600 rounded text-[10px] text-white"
            >
              Back btn
            </button>
          </div>
          {log.map((l, i) => (
            <div key={i} className="text-white/70 break-words">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
