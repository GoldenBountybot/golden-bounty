const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const out: Record<string, number> = {};
    const headers = { 'User-Agent': 'VIPSlots/1.0', 'Accept': 'application/json' };
    const bf: Record<string, string> = { btc: 'tBTCUSD', eth: 'tETHUSD', bnb: 'tBNBUSD', trx: 'tTRXUSD', ltc: 'tLTCUSD', doge: 'tDOGEUSD', ton: 'tTONUSD', sol: 'tSOLUSD', apt: 'tAPTUSD' };
    await Promise.all(Object.entries(bf).map(async ([k, sym]) => {
      try { const r = await fetch(`https://api-pub.bitfinex.com/v2/ticker/${sym}`, { headers });
        if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[6]) out[k] = Number(j[6]); } } catch {}
    }));
    const missing = Object.keys(bf).filter((k) => !out[k]);
    if (missing.length) {
      const gt: Record<string, string> = { btc: 'btc_usdt', eth: 'eth_usdt', bnb: 'bnb_usdt', trx: 'trx_usdt', ltc: 'ltc_usdt', doge: 'doge_usdt', ton: 'ton_usdt', sol: 'sol_usdt', apt: 'apt_usdt' };
      await Promise.all(missing.map(async (k) => {
        try { const r = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gt[k]}`, { headers });
          if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[0]?.last) out[k] = Number(j[0].last); } } catch {}
      }));
    }
    return new Response(JSON.stringify({ ok: true, prices: out }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, prices: {}, reason: String(e?.message || e) }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
