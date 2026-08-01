import React from 'react';

// High-fidelity branded circular crypto network logos.
// Each is a circular badge with the brand color background and a white brand
// mark inside — matching the premium deposit/withdraw UI style.

const BADGE = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', overflow: 'hidden', flexShrink: 0 };

export function CryptoLogo({ type, size = 40, color, className = '' }) {
  const s = size;
  const wrap = { ...BADGE, width: s, height: s, background: color || '#26a17b', boxShadow: '0 0 0 2px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.5)' };
  const vb = { viewBox: '0 0 32 32', width: s * 0.62, height: s * 0.62 };

  const render = () => {
    switch (type) {
      case 'trx':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3l13 6.5v13L16 29 3 22.5v-13L16 3zm-1.4 6.2l8.6 11.2-2.3-7.6 4.2-4.2-10.5.6zm-3.7 1.1c-.9.1-1 .4-.3.7l4.1 1.4-4.6 6 4.8-1.6 3.2-3.2-6.2-3.1c-.4-.2-.7-.2-1-.2z"/>
          </svg>
        );
      case 'bsc':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 4l4 2.3v4.6L16 13.2l-4-2.3V6.3L16 4zm8 4.6l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zM8 8.6l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zm8 8.2l4 2.3v4.6L16 26l-4-2.3v-4.6l4-2.3zm8 0l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zM8 16.8l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3z"/>
          </svg>
        );
      case 'eth':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3l-7 11.5 7 4 7-4L16 3zm0 16.5l-7-4 7 9.5 7-9.5-7 4z"/>
          </svg>
        );
      case 'pol':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 4l3.5 2v4L16 12l-3.5-2V6L16 4zm0 8l3.5 2v4L16 20l-3.5-2v-4l3.5-2zm0 8l3.5 2v0L16 28l-3.5-2v0l3.5-2z"/>
          </svg>
        );
      case 'sol':
        return (
          <svg {...vb} fill="#fff">
            <path d="M5 10.5l1.9-1.9h18.2L23.2 10.5H5zm0 5l1.9-1.9h18.2L23.2 15.5H5zm22 5l-1.9 1.9H6.9L8.8 20.5H27z"/>
          </svg>
        );
      case 'ton':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-4.5 7h9c.8 0 1.3.6 1.3 1.3 0 .2 0 .4-.1.6l-4.5 8.4c-.3.5-.8.7-1.2.7s-.9-.2-1.2-.7l-4.5-8.4c-.1-.2-.1-.4-.1-.6 0-.7.5-1.3 1.3-1.3zm4.5 2.8h-4.4l3.8 7c.1.2.3.2.4 0l3.8-7H16z"/>
          </svg>
        );
      case 'avax':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-1.6 16.5h-3.9l1.9-3.4c.2-.4.7-.4.9 0l1.9 3.4c.2.0 0 .5-.3.5zm6.8 1.5c0 .3-.2.5-.5.5h-4.9c-.4 0-.7-.3-.8-.6l-3.6-6.2c-.1-.2-.1-.5 0-.7l1.8-3.1c.2-.4.7-.4.9 0l7 11.6c.1.2.1.4.1.5z"/>
          </svg>
        );
      case 'apt':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 4l3 1.7v3.5L16 11l-3-1.8V5.7L16 4zm0 8l3 1.7v3.5L16 18.7l-3-1.7v-3.5L16 12zm0 8l3 1.7v3.5L16 26.7l-3-1.7v-3.5L16 20z"/>
          </svg>
        );
      case 'btc':
        return (
          <svg {...vb} fill="#fff">
            <path d="M18 4v3h2v2h-2v2h2v2h-2v3h-3v-2h-2v2h-3v-2H8v-2h2v-2H8V9h2V7h2V4h3v3h2V4h3zM13 11v2h2v-2h-2zm0 4v2h2v-2h-2z"/>
          </svg>
        );
      case 'ltc':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-1.5 5h5.2l-1 3.2h-3.1l-1 3.6 2.6-.9-.6 2.2-2.6.9-.9 3H8.8l1-3.6-2.3.8.6-2.2 2.3-.8L12 11h-2.5l.5-3z"/>
          </svg>
        );
      case 'doge':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-3 6h4.5c2.8 0 4.5 2.2 4.5 5.5S20.3 20 17.5 20H13V9zm2.5 2.5v6h1.8c1.4 0 2.2-1.2 2.2-3s-.8-3-2.2-3h-1.8z"/>
          </svg>
        );
      case 'dot':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm0 4.5l4 2.3v4.6L16 16.7l-4-2.3V9.8L16 7.5zm0 8l4 2.3v4.6L16 24.7l-4-2.3v-4.6l4-2.3z"/>
          </svg>
        );
      case 'usdt':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-1.5 5.5h3v2.2c2.6.1 4.5.7 4.5 1.6 0 .9-1.9 1.5-4.5 1.6v4.5h-3v-4.5c-2.6-.1-4.5-.7-4.5-1.6 0-.9 1.9-1.5 4.5-1.6V8.5zm0 4.2c-1.4.1-2.5.4-2.5.7 0 .3 1.1.6 2.5.7v-1.4zm3 1.4c1.4-.1 2.5-.4 2.5-.7 0-.3-1.1-.6-2.5-.7v1.4z"/>
          </svg>
        );
      case 'binance':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 4l4 2.3v4.6L16 13.2l-4-2.3V6.3L16 4zm8 4.6l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zM8 8.6l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zm8 8.2l4 2.3v4.6L16 26l-4-2.3v-4.6l4-2.3zm8 0l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3zM8 16.8l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3z"/>
          </svg>
        );
      case 'trust':
        return (
          <svg {...vb} fill="#fff">
            <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm-5 6.5h10v2.5h-3.5v9h-3v-9H11V9.5z"/>
          </svg>
        );
      default:
        return <span style={{ color: '#fff', fontWeight: 800, fontSize: s * 0.4 }}>₮</span>;
    }
  };

  return <span className={className} style={wrap}>{render()}</span>;
}

// Map a network name / key to a logo type + brand color.
export const CRYPTO_META = {
  trx:  { type: 'trx',  color: '#D83B26' },
  bsc:  { type: 'bsc',  color: '#F0B90B' },
  eth:  { type: 'eth',  color: '#627EEA' },
  pol:  { type: 'pol',  color: '#8247E5' },
  sol:  { type: 'sol',  color: '#14F195' },
  ton:  { type: 'ton',  color: '#0098EA' },
  avax: { type: 'avax', color: '#E84142' },
  apt:  { type: 'apt',  color: '#0A8B6F' },
  btc:  { type: 'btc',  color: '#F7931A' },
  ltc:  { type: 'ltc',  color: '#345D9D' },
  doge: { type: 'doge', color: '#C2A634' },
  dot:  { type: 'dot',  color: '#E6007A' },
  usdt: { type: 'usdt', color: '#26A17B' },
  binance: { type: 'binance', color: '#F0B90B' },
  trust: { type: 'trust', color: '#3375F6' },
};

export function detectCrypto(name) {
  const k = String(name || '').toLowerCase();
  if (k.includes('trx') || k.includes('tron') || k.includes('trc')) return 'trx';
  if (k.includes('bnb') || k.includes('bep') || k.includes('bsc') || k.includes('binance smart')) return 'bsc';
  if (k.includes('eth') || k.includes('erc')) return 'eth';
  if (k.includes('sol') || k.includes('solana')) return 'sol';
  if (k.includes('avax') || k.includes('avalanche')) return 'avax';
  if (k.includes('apt') || k.includes('aptos')) return 'apt';
  if (k.includes('ton')) return 'ton';
  if (k.includes('dot') || k.includes('polka')) return 'dot';
  if (k.includes('polygon') || k.includes('matic') || k.includes('pol')) return 'pol';
  if (k.includes('btc') || k.includes('bitcoin')) return 'btc';
  if (k.includes('ltc') || k.includes('lite')) return 'ltc';
  if (k.includes('doge')) return 'doge';
  if (k.includes('usdt') || k.includes('tether')) return 'usdt';
  return null;
}

export function cryptoMetaFor(name) {
  const t = detectCrypto(name);
  return t ? CRYPTO_META[t] : null;
}