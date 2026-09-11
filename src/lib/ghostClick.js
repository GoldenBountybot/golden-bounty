// Swallows the browser's own click that follows a pointerdown-triggered
// navigation. Lives at MODULE scope on purpose: the listener must outlive the
// page that armed it — the source page unmounts the moment navigation starts,
// which would otherwise strip the listener before the ghost click fires and
// the click would land on whatever card the next page renders at those
// coordinates.
let until = 0;
let installed = false;
const swallow = (e) => {
  if (Date.now() > until) return;
  until = 0;
  e.stopPropagation();
  e.preventDefault();
};

export function swallowNextClick(ms = 900) {
  until = Date.now() + ms;
  if (!installed) {
    installed = true;
    // Capture phase on window: runs before React's root listener, so the
    // ghost click never reaches any handler on the freshly opened page.
    window.addEventListener('click', swallow, true);
  }
}
