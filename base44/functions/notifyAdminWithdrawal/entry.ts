import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Notifies all admin users by email when a player submits a withdrawal.
// Admins are auto-picked from the User entity via service role (no hardcoded
// address), so any registered admin receives the notice.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) {}
    const amount = Number(body.amount || 0);
    const network = String(body.network || '');
    const wallet = String(body.wallet || '');
    if (!amount || amount < 1) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    // Auto-pick every admin (service role bypasses the user-only RLS on User).
    const admins = await base44.asServiceRole.entities.User.list(100);
    const adminEmails = (admins || [])
      .filter((u: any) => u.role === 'admin' && u.email)
      .map((u: any) => u.email);

    if (!adminEmails.length) {
      return Response.json({ ok: false, reason: 'no-admins', notified: 0 });
    }

    const subject = `Withdrawal request · $${amount.toFixed(2)} · ${user.email || user.id}`;
    const walletPreview = wallet ? wallet.slice(0, 10) + '…' : '—';
    const bodyText =
      `A new withdrawal request was submitted.\n\n` +
      `Player: ${user.email || user.id}\n` +
      `Amount: $${amount.toFixed(2)}\n` +
      `Method: USDT${network ? ' · ' + network : ''}\n` +
      `Wallet: ${walletPreview}\n\n` +
      `Review and approve it in the Admin dashboard → Transactions.`;

    let sent = 0;
    for (const email of adminEmails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body: bodyText,
          from_name: 'Golden Bounty',
        });
        sent++;
      } catch (_e) {
        // continue sending to the rest even if one fails
      }
    }

    return Response.json({ ok: true, notified: sent, admins: adminEmails.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}