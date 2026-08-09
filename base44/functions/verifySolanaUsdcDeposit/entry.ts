import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { creditDeposit } from '../../shared/wallet.ts';

// Verifies a USDC (SPL token) deposit on Solana sent from the user's Phantom
// wallet to the admin's USDC Associated Token Account, then records a
// completed Transaction. Idempotent by transaction signature. Uses the
// public Solana RPC — no secret needed.
// PublicNode free RPC — the Solana public endpoint (api.mainnet-beta.solana.com)
// 403-blocks this server's IP. PublicNode is free, key-less, and reliable.
const SOLANA_RPC = 'https://solana-rpc.publicnode.com';
const ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function rpc(method, params) {
  const r = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  return j?.result ?? null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const signature = String(body.signature || '');
    const amount = Number(body.amount);
    const userWallet = String(body.userWallet || '');
    const expectedUnits = Number(body.expectedUnits);
    if (!signature || !isFinite(amount) || amount <= 0 || !userWallet || !expectedUnits) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    // Idempotency: a deposit for this signature was already credited.
    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: signature });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    const tx = await rpc('getTransaction', [signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
    if (!tx) return Response.json({ ok: false, reason: 'pending' });
    if (tx.meta?.err) return Response.json({ ok: false, reason: 'tx-failed' });

    const keys = (tx.transaction.message.accountKeys || []).map((a) => (typeof a === 'string' ? a : a.pubkey));
    // Fee payer (signer) must be the connected wallet.
    if (keys[0] !== userWallet) return Response.json({ ok: false, reason: 'sender-mismatch' });

    // USDC received by the admin = post - pre token balance for the admin's
    // USDC ATA. The ATA may be newly created in this tx (pre = 0).
    const findAmt = (arr) => {
      const e = (arr || []).find((b) => b.mint === USDC_MINT && b.owner === ADMIN);
      return e ? BigInt(String(e.uiTokenAmount?.amount || '0')) : 0n;
    };
    const received = findAmt(tx.meta.postTokenBalances) - findAmt(tx.meta.preTokenBalances);
    // Allow a 1% rounding tolerance on the transferred units.
    if (received < BigInt(Math.round(expectedUnits * 0.99))) return Response.json({ ok: false, reason: 'amount-mismatch' });

    await creditDeposit(base44, user.id, user.email, amount, 'wallet-phantom-solana-usdc', signature, 'Phantom · Solana (USDC)');

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});