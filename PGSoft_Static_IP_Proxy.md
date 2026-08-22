# PG SOFT static-IP relay (VPS)

PG SOFT only accepts outbound requests from a whitelisted **static IP**.
Our app runtime has dynamic egress IPs, so every PG-bound request is relayed
through the VPS, which owns the static IP given to PG SOFT.

## 1. On the VPS

```bash
sudo apt update && sudo apt install -y nodejs npm
mkdir -p /opt/pg-relay && cd /opt/pg-relay
npm init -y && npm i express
```

Create `/opt/pg-relay/server.js`:

```js
const express = require('express');
const app = express();
app.use(express.json({ limit: '2mb' }));

const TOKEN = process.env.RELAY_TOKEN;              // shared secret
const ALLOW = /(^|\.)pgsoft\.net$|(^|\.)pg-soft\./; // only PG SOFT hosts

app.post('/relay', async (req, res) => {
  if (req.headers['x-relay-token'] !== TOKEN) return res.status(401).send('bad token');
  const { url, method = 'GET', headers = {}, body = null } = req.body || {};
  let host;
  try { host = new URL(url).hostname; } catch { return res.status(400).send('bad url'); }
  if (!ALLOW.test(host)) return res.status(403).send('host not allowed');

  try {
    const r = await fetch(url, { method, headers, body });
    const text = await r.text();
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.set('content-type', ct);
    res.send(text);
  } catch (e) {
    res.status(502).send(String(e));
  }
});

app.get('/health', (_, res) => res.send('ok'));
app.listen(8080, () => console.log('pg-relay on :8080'));
```

Run it permanently:

```bash
sudo tee /etc/systemd/system/pg-relay.service >/dev/null <<'EOF'
[Unit]
Description=PG SOFT static-IP relay
After=network.target

[Service]
WorkingDirectory=/opt/pg-relay
Environment=RELAY_TOKEN=CHOOSE_A_LONG_RANDOM_TOKEN
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now pg-relay
```

Put it behind HTTPS (Caddy is easiest) so the relay URL is `https://<domain>`:

```bash
sudo apt install -y caddy
echo 'relay.golden-bounty.com { reverse_proxy 127.0.0.1:8080 }' | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## 2. App secrets

- `PGSOFT_PROXY_URL` → `https://relay.golden-bounty.com`
- `PGSOFT_PROXY_TOKEN` → the same `RELAY_TOKEN`

When these are set, `pgFetch()` in `base44/shared/pgsoft.ts` routes all PG SOFT
calls through the VPS. If they are empty, it falls back to a direct call.

## 3. PG SOFT whitelist

Give PG SOFT the VPS static IPv4 (single IP or `/32`). All PG-bound traffic now
originates there, so it never changes again.