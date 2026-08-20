import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns the outbound IP of the Base44 backend function runtime.
// PG Soft needs this IP whitelisted so our Seamless Wallet callbacks can
// reach their servers. Call this once and give the IP to PG Soft support.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Try multiple IPv4-only endpoints (PG Soft whitelist needs IPv4).
    let ipv4 = null, ipv6 = null;
    const v4Endpoints = [
      'https://ipv4.icanhazip.com/',
      'https://4.ipw.cn/',
      'https://api.ipify.org?format=text',
    ];
    for (const url of v4Endpoints) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'curl/8' } });
        if (r.ok) {
          const t = (await r.text()).trim();
          if (t && /^\d+\.\d+\.\d+\.\d+$/.test(t)) { ipv4 = t; break; }
        }
      } catch {}
    }
    try {
      const r6 = await fetch('https://api64.ipify.org?format=json');
      ipv6 = (await r6.json()).ip;
    } catch {}
    return Response.json({ ipv4, ipv6, outbound_ip: ipv4 || ipv6 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}