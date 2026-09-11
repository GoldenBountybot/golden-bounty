import { supabase } from '@/api/supabaseClient';

// Silent navigation diagnostics, written to the same wc_diag_logs table the
// wallet-connect flow already uses. One row per event so a bounce-back seen on
// a phone can be replayed exactly: which page, which direction, and whether
// it came from the native back arrow (goBack), a webview-level popstate, or
// nothing the app did at all.
const t0 = Date.now();
let lastFrom = null;

export function navDiag(event, detail) {
  try { console.log(`[gb-nav] +${Date.now() - t0}ms ${event} ${detail || ''}`); } catch {}
  try {
    supabase.from('wc_diag_logs').insert({ event, detail: detail || null, elapsed_ms: Date.now() - t0 }).then(() => {}, () => {});
  } catch {}
}

export function navDiagRoute(pathname) {
  navDiag('nav-change', `${lastFrom || '(boot)'} -> ${pathname}`);
  lastFrom = pathname;
}
