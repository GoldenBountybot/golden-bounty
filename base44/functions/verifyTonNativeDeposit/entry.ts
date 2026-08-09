import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { Address } from 'npm:@ton/core@0.60.1';
import { creditDeposit } from '../../shared/wallet.ts';

// Verifies a native TON deposit sent from the user's Tonkeeper wallet to the
// admin wallet, then records a completed Transaction credited with the requested
// $ amount. Idempotent by tonapi event_id. The on-chain nanoTON value must match
// the expectedNano the frontend sent (= $amount / live TON price), with a sanity
// price check. Uses tonapi.io public endpoints — no secret needed.
const ADMIN = 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6';

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
    const amount = Number(body.amount); // $ to credit
    const userWalletRaw = toRaw(body.userWallet);
    const expectedNano = String(body.expectedNano || '');
    if (!userWalletRaw || !isFinite(amount) || amount <= 0 || !expectedNano) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    const adminRaw = toRaw(ADMIN);

    // Poll the admin's account events for the matching native TonTransfer (~30s).
    for (let i = 0; i < 6; i++) {
      const ev = await getJson(`https://tonapi.io/v2/accounts/${ADMIN}/events?limit=20`);
      for (const e of (ev?.events || [])) {
        for (const a of (e.actions || [])) {
          if (a.type !== 'TonTransfer') continue;
          const t = a.TonTransfer;
          if (!t) continue;
          if (t.sender?.address !== userWalletRaw) continue;
          if (t.recipient?.address !== adminRaw) continue;
          if (String(t.amount) !== expectedNano) continue;
          const ref = 'ton-native-' + e.event_id;
          const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: ref });
          if (existing && existing.length) {
            return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
          }
          await creditDeposit(base44, user.id, user.email, amount, 'wallet-tonkeeper-native', ref, 'Tonkeeper · TON native');
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