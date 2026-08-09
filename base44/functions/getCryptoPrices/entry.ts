// Returns live USD prices for BTC, ETH, BNB, TRX, LTC, DOGE, TON, SOL, APT.
// Bitfinex primary, Gate.io fallback. Both are key-less, geo-friendly, and
// accessible from the function runtime.
Deno.serve(async (req) => {
  try {
    const out = {};
    const headers = { 'User-Agent': 'VIPSlots/1.0', 'Accept': 'application/json' };

    // Primary: Bitfinex ticker (LAST_PRICE is element 6 of the returned array).
    const bf = {
      btc: 'tBTCUSD', eth: 'tETHUSD', bnb: 'tBNBUSD', trx: 'tTRXUSD',
      ltc: 'tLTCUSD', doge: 'tDOGEUSD', ton: 'tTONUSD', sol: 'tSOLUSD', apt: 'tAPTUSD',
    };
    await Promise.all(Object.entries(bf).map(async ([k, sym]) => {
      try {
        const r = await fetch(`https://api-pub.bitfinex.com/v2/ticker/${sym}`, { headers });
        if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[6]) out[k] = Number(j[6]); }
      } catch {}
    }));

    // Fallback: Gate.io.
    const missing = Object.keys(bf).filter((k) => !out[k]);
    if (missing.length) {
      const gt = {
        btc: 'btc_usdt', eth: 'eth_usdt', bnb: 'bnb_usdt', trx: 'trx_usdt',
        ltc: 'ltc_usdt', doge: 'doge_usdt', ton: 'ton_usdt', sol: 'sol_usdt', apt: 'apt_usdt',
      };
      await Promise.all(missing.map(async (k) => {
        try {
          const r = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gt[k]}`, { headers });
          if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[0]?.last) out[k] = Number(j[0].last); }
        } catch {}
      }));
    }

    return Response.json({ ok: true, prices: out });
  } catch (error) {
    return Response.json({ ok: false, prices: {}, reason: String(error?.message || error) });
  }
});