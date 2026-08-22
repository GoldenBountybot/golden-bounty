# PG Soft — Callback URLs (Seamless Wallet)

All PG Soft callbacks now run on Supabase Edge Functions, independent of Base44 credits.
Outbound calls to PG Soft leave through the VPS relay static IP.

**Static SERVER IP (unchanged, already submitted):** `172.245.40.68`

## Callback endpoints

Base URL: `https://ovyrljtgviabkamomjso.supabase.co/functions/v1`

| PG Soft callback | URL |
|---|---|
| VerifySession | `https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-verify-session` |
| Get Player Wallet (CashGet) | `https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-get` |
| Bet Payout (CashTransferInOut) | `https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-transfer` |
| Balance Adjustment | `https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-adjustment` |

Currency: **USDT** (USD disclaimer agreed, as submitted in the form).

## Email draft to PG Soft (CaseID: P23502)

```
Dear KIM / PG Soft Team,

Please note our updated Seamless Wallet callback endpoints. All other details
previously submitted (brand, SERVER IP, currency and disclaimers) remain unchanged.

SERVER IP (unchanged): 172.245.40.68

Callback URLs:
- VerifySession:      https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-verify-session
- Get Player Wallet:  https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-get
- Bet Payout:         https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-transfer
- Balance Adjustment: https://ovyrljtgviabkamomjso.supabase.co/functions/v1/pgsoft-cash-adjustment

Kindly configure these endpoints for both Staging and Production.

Best regards,
Golden Bounty Team
goldenbountysupport@gmail.com
``