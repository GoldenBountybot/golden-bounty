// Serves the TON Connect app manifest dynamically so the wallet (Tonkeeper)
// can fetch it at a guaranteed-reachable URL. `url` is set to the real app
// origin (from the request), avoiding fake/hardcoded domains the wallet rejects.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }
  const u = new URL(req.url);
  const origin = `${u.protocol}//${u.host}`;
  const manifest = {
    url: origin,
    name: 'VIP Slots',
    iconUrl: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0dafcc686_.jpg',
    termsOfUseUrl: `${origin}/`,
    privacyPolicyUrl: `${origin}/`,
  };
  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
});