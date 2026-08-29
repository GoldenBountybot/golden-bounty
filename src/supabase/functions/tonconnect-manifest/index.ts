// TonConnect manifest served publicly (no auth) so wallets can fetch it.
const MANIFEST = {
  url: 'https://golden-bounty.com',
  name: 'Golden Bounty',
  iconUrl: 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/b1a2d7d3e_file_000000009ef4820baac5161c2e45158b.png',
  termsOfUseUrl: 'https://golden-bounty.com',
  privacyPolicyUrl: 'https://golden-bounty.com',
};

Deno.serve(() => new Response(JSON.stringify(MANIFEST), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  },
}));