# PG Soft Seamless Wallet — Endpoints (CaseID P23502)

Currency: **USDT** (base unit 1 → `real_transfer_amount` = `transfer_amount`)
Operator API domain to give PG Soft: **https://golden-bounty.com/pgsoft**

## Callback endpoints PG Soft will call

| PG Soft spec URL | Base44 function |
|---|---|
| `{OperatorAPIDomain}/VerifySession` | `pgsoftVerifySession` |
| `{OperatorAPIDomain}/Cash/Get` | `pgsoftCashGet` |
| `{OperatorAPIDomain}/Cash/TransferInOut` | `pgsoftCashTransferInOut` |
| `{OperatorAPIDomain}/Cash/Adjustment` | `pgsoftCashAdjustment` |

All return HTTP 200 with `{"data": {...}, "error": null}` or `{"data": null, "error": {"code","message"}}`.
Duplicate `transaction_id` / `adjustment_transaction_id` returns the stored result without moving money (idempotent).

## Nginx mapping on the VPS (172.245.40.68)

Each PG Soft path must proxy to its Base44 function URL:

```nginx
location = /pgsoft/VerifySession {
  proxy_pass https://<base44-app-domain>/api/apps/6a5698edffaa42a5b6637776/functions/pgsoftVerifySession;
  proxy_set_header Content-Type application/x-www-form-urlencoded;
}
location = /pgsoft/Cash/Get {
  proxy_pass https://<base44-app-domain>/api/apps/6a5698edffaa42a5b6637776/functions/pgsoftCashGet;
}
location = /pgsoft/Cash/TransferInOut {
  proxy_pass https://<base44-app-domain>/api/apps/6a5698edffaa42a5b6637776/functions/pgsoftCashTransferInOut;
}
location = /pgsoft/Cash/Adjustment {
  proxy_pass https://<base44-app-domain>/api/apps/6a5698edffaa42a5b6637776/functions/pgsoftCashAdjustment;
}
```

Keep `$request_uri` query string forwarding on (default) so `trace_id` reaches the function.

## Game launch

`pgsoftLaunchGame` (frontend → `base44.functions.invoke('pgsoftLaunchGame', { game_id, language })`):
1. Creates the `operator_player_session` token (24h, stored in `PgSoftSession`).
2. Calls PG Soft `GetLaunchURLHTML` with `operator_token`, `path=/{game_id}/index.html`,
   `extra_args=btt=1&ops={session}&l={language}`, `url_type=game-entry`, `client_ip`.
3. Returns the HTML code — render it unmodified inside an iframe with:
   `allow="web-share *; clipboard-write *; screen-wake-lock *; fullscreen *"`.

## Hash authentication (optional)

Disabled while `PGSOFT_HASH_SALT` is `PENDING`. Once a real salt is set and PG Soft sends the
`Authorization` header, every request is verified as
`hmac-sha256(salt, host + x-content-sha256 + x-date)` plus a SHA-256 body check.