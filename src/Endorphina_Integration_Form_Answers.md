# Endorphina — seamless wallet integration info (filled)

Copy-paste this into the reply to Endorphina (the English version of their form).

General info:
- Brand name: Golden Bounty (golden-bounty.com)
- The email where we have to send the key's information to: tech@golden-bounty.com
- If available, provide staging website: https://golden-bounty.base44.app
- Callback endpoint URL for staging server: https://ovyrljtgviabkamomjso.supabase.co/functions/v1/endorphina
- Callback endpoint URL for production server: https://ovyrljtgviabkamomjso.supabase.co/functions/v1/endorphina
- Currencies you want to enable (Pick 3): USD, EUR, USDT

Free trial games (edemo) for players:
- Should you need demo game mode: Not for now (we will request edemo later if needed)

Server configuration:
- Do you want to receive /win with amount=0 requests? Yes
- Do you want to receive a notification when a game session ends? Yes
- Do you want to receive additional session info with each request? Yes
- Do you support bet denominations lower 0.01? No

Tournament integration (page 22):
- Do you want to implement our tournament tool? Yes (promoWin endpoint is implemented)

Free spins integration:
- If you want to implement free spins: Not in the first phase. We may add it later (seamless wallet-like).

Free credits integration (pages 23-28):
- Do you want to implement our free credits bonus tool? No (not in the first phase)

Also ask them for:
- Game thumbnails / media kit (URLs or a CDN) for the lobby cards.
- Confirmation that the Endorphina server IPs are 178.33.61.104 and 88.198.136.152 (whitelisting on our side is not required — our endpoints are public HTTPS with signature verification).

---

## What is already built on our side

All endpoints live under ONE base URL (Endorphina appends the method name):

  https://ovyrljtgviabkamomjso.supabase.co/functions/v1/endorphina

| Route        | Method | Status |
|--------------|--------|--------|
| /session     | GET    | done   |
| /balance     | GET    | done   |
| /bet         | POST   | done — idempotent by Endorphina id, 402 on insufficient funds, 403 LIMIT_REACHED for banned players |
| /refund      | POST   | done — unknown bet id is stored as cancelled, balance untouched |
| /win         | POST   | done — idempotent; zero wins acknowledged without money movement |
| /promoWin    | POST   | done — text prizes (data field) are report-only |
| /endSession  | POST   | done   |
| /check       | GET    | done   |
| /bonus       | POST   | acknowledged (transfer-wallet bonus mode not enabled) |

Config (Supabase function secrets): ENDORPHINA_NODE_ID, ENDORPHINA_SALT, ENDORPHINA_API_URL.
Currently set to the MOCK values from the acceptance-test package (nodeId 8, key 0D938F8D541A4D65A32497CE92E28824,
https://test.endorphina.com). Replace them with the real staging / production values when Endorphina sends the keys.

Player id sent to Endorphina = our user uuid without dashes (32 hex chars). Currency = USD. Amounts ×1000.

## Acceptance test — we cannot run the Java tool ourselves (no computer / no Java runtime)

Every callback was already verified by us with the mock key: check ✓, wrong signature → 401 ✓,
unknown token → 404 ✓, bet → win → refund cycle with idempotent retries ✓, win amount=0 ✓,
refund of unknown bet ✓, late bet after refund ✓, insufficient funds → 402 ✓.

The test session token from the manual (d1fe901b577f459abc0b2298a1f9f1dd — lower AND upper case) is
pre-registered on our side with a 90-day expiry, so Endorphina's team can run the acceptance test
directly against our staging URL. Message to send them (Telegram group / tech email):

> Hi team, our seamless wallet endpoints are ready on staging:
> https://ovyrljtgviabkamomjso.supabase.co/functions/v1/endorphina
> (nodeId 8 / mock key from the test package). All routes — session, balance, bet, refund, win, promoWin,
> endSession, check — are implemented and verified against the v1.8.1 spec (signature check, idempotent
> transactions, insufficient funds 402, refund of an unknown bet stored as cancelled, win amount=0 accepted).
> The session token from the acceptance-test manual (d1fe901b577f459abc0b2298a1f9f1dd) is already active
> on our side. We currently don't have an environment to run the Java acceptance-test jar — could you please
> run the Base suite against our staging URL from your side, or issue the staging nodeId/key so we can move
> on to the staging game test? Thanks!

## Running the acceptance test (only if someone with a Java 11+ computer helps)

1. Unzip Seamless Tests/endorphina-acceptance-test-2.9.zip
2. In configuration.properties set:
     tests.seamlessUrl=https://ovyrljtgviabkamomjso.supabase.co/functions/v1/endorphina
     tests.nodeId=8
     tests.secretKey=0D938F8D541A4D65A32497CE92E28824
     tests.port=8080
     tests.suite=Base
3. Run:  java -jar endorphina-acceptance-test-2.9.jar
4. Open in a browser:
     http://localhost:8080/api/sessions/seamless/rest/v1?exit=http://google.com&nodeId=8&token=d1fe901b577f459abc0b2298a1f9f1dd&sign=cadf144fb63950a9eb813ca44a5e1ac77a906e4e
5. Send the generated HTML report + the filled form above to Endorphina.