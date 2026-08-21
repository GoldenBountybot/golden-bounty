# PG Soft Integration Form — Corrections (CaseID: P23502)

Two fixes needed: (1) SERVER IP must be IPv4, (2) Currency should be **USDT** (PG officially supports USDT at 1:1 — confirmed in PG's currency appendix). Using USDT means the strict USD/US-operation disclaimer no longer applies.

---

## Sheet 1: "New Integration"

### Part 1: General Information — Currency section

| Field | Current | Correct Value |
|---|---|---|
| *Choice of Currencies / 选择货币 | USD | **USDT** ✅ |
| *Person in charge of 1:1000 currency unit | N/A - USD... | **N/A — USDT is used at 1:1, no 1:1000 currency unit** |
| *Integrate currency USD or SC&GC → Operator request Integrating currency USD or SC&GC | Yes - USD | **No — we integrate USDT (crypto stablecoin, 1:1), not USD or SC&GC** |
| ↳ Disclaimer agreement (USD/SC&GC) | Agreed... USD... | **N/A — currency is USDT, not USD or SC&GC** |

### Part 2: Test Environment (IP Whitelist)

| Field | Current (WRONG) | Correct Value |
|---|---|---|
| *OFFICE IP | 37.111.223.255 | 37.111.223.255 (no change) |
| *SERVER IP | **2a06:98c0:3600::103** ❌ IPv6 | **<STATIC_IPV4>** ✅ (from QuotaGuard/Fixie — pending) |

### Part 3: Production Environment (IP Whitelist)

| Field | Current (WRONG) | Correct Value |
|---|---|---|
| *OFFICE IP | 37.111.223.255 | 37.111.223.255 (no change) |
| *SERVER IP | **2a06:98c0:3600::103** ❌ IPv6 | **<STATIC_IPV4>** ✅ (same as above) |

> ⚠️ `<STATIC_IPV4>` = the IPv4 you get after signing up to QuotaGuard Static / Fixie (managed static-IP proxy — no server to manage). Once you share it, I'll route PG calls through the proxy and finalize the form.
> (If you prefer to keep using the existing VPS instead, use 172.245.40.68 here.)

---

## Sheet 6: "External API Whitelist"

Downline 1 column:

| Field | Value |
|---|---|
| *Brand Name | GoldenBounty |
| * Production Operator Token | (PG Soft provides — leave blank if not assigned) |
| * Production SERVER IP | **<STATIC_IPV4>** |
| * Staging Operator Token | (PG Soft provides — leave blank if not assigned) |
| * Staging SERVER IP | **<STATIC_IPV4>** |
| * Event Type | Seamless Wallet |

---

## Email Reply (send with the corrected form)

```
Dear KIM / PG Soft Team,

Thank you for the feedback. We have corrected the form:

Part A — SERVER IP: corrected to IPv4 format: <STATIC_IPV4>
(both Test and Production environments).

Part B — Currency: we have updated our Choice of Currencies to USDT
(supported at 1:1 per your currency list), as our platform operates in
USDT. Since we are no longer requesting the USD currency, we understand
the USD disclaimer does not apply. If you still require it, we confirm:
"We agree all disclaimers of PG regarding Currency = USD."

The corrected form is attached. Please advise if anything else is needed.

Best regards,
Golden Bounty Team
goldenbountysupport@gmail.com
CaseID: P23502
```

---

## Summary of ALL changes

1. Currency: USD → **USDT** (Part 1, Choice of Currencies)
2. "Integrate currency USD or SC&GC" → **No** (USDT is neither)
3. USD disclaimer → **N/A** (kept a fallback agreement line in the email just in case)
4. SERVER IP (Test + Production + External API Whitelist) → **static IPv4** from QuotaGuard/Fixie (pending), or 172.245.40.68 if keeping the VPS