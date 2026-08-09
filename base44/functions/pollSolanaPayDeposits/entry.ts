import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Polls the admin Solana wallet for incoming USDC (SPL) transfers that match a
// pending SolanaDepositRequest by its unique `pay_units` amount, then credits
// the user's balance server-side. This powers the browser QR (Solana Pay) flow
// which works from any browser — no Phantom deep-link / injected provider.
//
// Idempotency: a request is claimed atomically (status pending -> completed +
// signature) before crediting, so concurrent polls (frontend + workflow) never
// double-credit. The Transaction record keyed by signature is the second guard.
//
// PublicNode free RPC — the public Solana endpoint 403-blocks server IPs.
const RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  'https://api2.mainnet-beta.solana.com',
];
const ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function rpc(method, params) {
  let lastErr = null;
  for (const url of RPC_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      const j = await r.json();
      if (j?.error) throw new Error('rpc: ' + (j.error.message || j.error.code));
      return j?.result ?? null;
    } catch (e) { lastErr = String(e?.message || e); }
  }
  throw new Error(lastErr || 'rpc failed');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestId = body.request_id ? String(body.request_id) : null;

    // Load pending request(s).
    let pending;
    if (requestId) {
      pending = await base44.asServiceRole.entities.SolanaDepositRequest.filter({ id: requestId, status: 'pending' });
    } else {
      pending = await base44.asServiceRole.entities.SolanaDepositRequest.filter({ status: 'pending' }, '-created_date', 100);
    }
    if (!pending || !pending.length) return Response.json({ ok: true, completed: [], pendingCount: 0 });

    // Only inspect signatures newer than the oldest pending request (minus buffer).
    const oldestMs = Math.min(...pending.map((p) => new Date(p.created_date).getTime())) - 180000;
    let sigs;
    try {
      sigs = await rpc('getSignaturesForAddress', [ADMIN, { limit: 25 }]);
    } catch (e) {
      return Response.json({ ok: false, reason: 'rpc: ' + (e?.message || e) });
    }
    const recent = (sigs || []).filter((s) => !s.err && (s.blockTime || 0) * 1000 >= oldestMs);

    const completed = [];
    for (const s of recent) {
      // Already processed? (idempotency guard #1)
      let existing;
      try { existing = await base44.asServiceRole.entities.Transaction.filter({ reference: s.signature }); } catch { existing = []; }
      if (existing && existing.length) continue;

      let tx;
      try { tx = await rpc('getTransaction', [s.signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]); }
      catch { continue; }
      if (!tx || tx.meta?.err) continue;

      // USDC received by admin's ATA.
      const findAmt = (arr) => {
        const e = (arr || []).find((b) => b.mint === USDC_MINT && b.owner === ADMIN);
        return e ? Number(String(e.uiTokenAmount?.amount || '0')) : 0;
      };
      const received = findAmt(tx.meta.postTokenBalances) - findAmt(tx.meta.preTokenBalances);
      if (received <= 0) continue;

      // Match by exact pay_units (Solana Pay sends exactly the requested amount).
      const match = pending.find((p) => Number(p.pay_units) === received);
      if (!match) continue;

      // Atomic claim: status pending -> completed + signature (idempotency guard #2).
      let claimed = false;
      try {
        const res = await base44.asServiceRole.entities.SolanaDepositRequest.updateMany(
          { id: match.id, status: 'pending' },
          { $set: { status: 'completed', signature: s.signature } }
        );
        const n = res?.modifiedCount ?? res?.updatedCount ?? res?.updated ?? res?.n ?? 0;
        claimed = Number(n) > 0;
      } catch { claimed = false; }
      if (!claimed) continue; // another concurrent run already handled it

      // Credit the actual received USD to the user's balance + wager requirement.
      // ATOMIC $inc — prevents the read-modify-write race condition where a
      // concurrent operation overwrites this deposit credit.
      const receivedUsd = Math.min(received / 1e6, 100000); // defense-in-depth cap
      try {
        const wallet = await findOrCreateWallet(base44, match.user_id);
        if (wallet.banned) throw new Error('Account banned');
        await base44.asServiceRole.entities.Wallet.updateMany(
          { user_id: match.user_id },
          { $inc: { balance: receivedUsd, wager_remaining: receivedUsd } }
        );
        // balance & wager_remaining are no longer on the User entity (moved to
        // the RLS-protected Wallet entity). No mirror needed.
      } catch (e) {
        // Balance credit failed — roll the request back to pending so a later
        // poll can retry. Don't lose the user's money.
        try {
          await base44.asServiceRole.entities.SolanaDepositRequest.updateMany(
            { id: match.id, status: 'completed' },
            { $set: { status: 'pending', signature: '' } }
          );
        } catch {}
        return Response.json({ ok: false, reason: 'credit-failed: ' + (e?.message || e) });
      }

      try {
        await base44.asServiceRole.entities.Transaction.create({
          user_id: match.user_id,
          user_email: match.user_email || '',
          type: 'deposit',
          amount: receivedUsd,
          status: 'completed',
          method: 'solana-pay-usdc',
          reference: s.signature,
          note: 'Solana Pay · USDC (browser QR)',
        });
      } catch {}

      completed.push({ request_id: match.id, amount: receivedUsd, signature: s.signature });
    }

    return Response.json({ ok: true, completed, pendingCount: pending.length - completed.length });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});