// True when the app is running as an installed app (native wrapper / PWA
// standalone) rather than in a normal browser tab. Used to skip the web
// splash image, since the installed app already shows its own splash.
export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.navigator.standalone === true) return true;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    // Base44 native wrapper webviews
    if (/wv|Median|Capacitor|Cordova/i.test(window.navigator.userAgent)) return true;
  } catch {}
  return false;
}