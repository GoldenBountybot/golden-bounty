import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { Address } from 'npm:@ton/core@0.60.1';
import { creditDeposit } from '../../shared/wallet.ts';

// Verifies a USDT (Jetton) deposit on TON sent from the user's Tonkeeper wallet
// to the admin wallet, then records a completed Transaction. Idempotent by the
// tonapi event_id. Uses tonapi.io public endpoints — no secret needed.
const ADMIN = 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6';
const USDT_MASTER_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
const DECIMALS = 6;

function toRaw(addr) {
  try { return '0:' + Address.parse(addr).hash.toString('hex'); } catch { return ''; }
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  return await r.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const userWalletRaw = toRaw(body.userWallet);
    if (!userWalletRaw || !isFinite(amount) || amount <= 0) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    const adminRaw = toRaw(ADMIN);
    const expected = BigInt(Math.round(amount * Math.pow(10, DECIMALS))).toString();

    // Resolve the admin's USDT jetton wallet (where transfer notifications land).
    const adminJettons = await getJson(`https://tonapi.io/v2/accounts/${ADMIN}/jettons`);
    const adminJettonWallet = (adminJettons?.balances || [])
      .find((b) => b.jetton?.address === USDT_MASTER_RAW)?.wallet_address?.address;
    if (!adminJettonWallet) return Response.json({ ok: false, reason: 'admin-wallet-not-found' });

    // Poll the admin's jetton wallet events for the matching incoming transfer (~30s).
    for (let i = 0; i < 6; i++) {
      const ev = await getJson(`https://tonapi.io/v2/accounts/${adminJettonWallet}/events?limit=20`);
      const events = ev?.events || [];
      for (const e of events) {
        for (const a of (e.actions || [])) {
          if (a.type !== 'JettonTransfer') continue;
          const j = a.JettonTransfer;
          if (!j) continue;
          if (j.sender?.address !== userWalletRaw) continue;
          if (j.recipient?.address !== adminRaw) continue;
          if (j.jetton?.address !== USDT_MASTER_RAW) continue;
          if (j.amount !== expected) continue;
          // Matched — idempotent by event_id.
          const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: e.event_id });
          if (existing && existing.length) {
            return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
          }
          await creditDeposit(base44, user.id, user.email, amount, 'wallet-tonkeeper', e.event_id, 'Tonkeeper · USDT TON');
          return Response.json({ ok: true, amount, already: false });
        }
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    return Response.json({ ok: false, reason: 'pending' });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});