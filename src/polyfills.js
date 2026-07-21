import { Buffer } from 'buffer'

// @ton/core (used by TON Connect) references the Node `Buffer` global which is
// not available in the browser. Expose it on window before any app code loads.
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
}