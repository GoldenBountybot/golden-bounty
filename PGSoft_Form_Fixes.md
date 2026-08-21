# PG Soft Integration Form — Corrections (CaseID: P23502)

PG Soft rejected because SERVER IP was in IPv6 format. Below are the exact changes to make in the Excel file, sheet by sheet.

---

## Sheet 1: "New Integration"

### Part 2: Test Environment (IP Whitelist section)

| Field | Current (WRONG) | Correct Value |
|---|---|---|
| *OFFICE IP / 办公室IP | 37.111.223.255 | 37.111.223.255 (no change) |
| *SERVER IP / 服务器IP | **2a06:98c0:3600::103** ❌ | **172.245.40.68** ✅ |

### Part 3: Production Environment (IP Whitelist section)

| Field | Current (WRONG) | Correct Value |
|---|---|---|
| *OFFICE IP / 办公室IP | 37.111.223.255 | 37.111.223.255 (no change) |
| *SERVER IP / 服务器IP | **2a06:98c0:3600::103** ❌ | **172.245.40.68** ✅ |

> ⚠️ Both Test AND Production SERVER IP must be changed from IPv6 to IPv4.

---

## Sheet 6: "External API Whitelist"

Fill the Downline 1 column with these values:

| Field | Downline 1 Value |
|---|---|
| *Brand Name / 品牌名称 | GoldenBounty |
| * Production Operator Token / 正式环境运营商OT | (PG Soft will provide — leave blank if not yet assigned) |
| * Production SERVER IP / 正式环境服务器IP | **172.245.40.68** |
| * Staging Operator Token / 测试环境运营商OT | (PG Soft will provide — leave blank if not yet assigned) |
| * Staging SERVER IP / 测试环境服务器IP | **172.245.40.68** |
| * Event Type / 活动类型 | Seamless Wallet |

---

## Currency & Disclaimer (already filled correctly in form — verify)

The form already has:
- Choice of Currencies = **USD** ✅ (PG Soft uses USD as base; operator converts USDT↔USD before API calls)
- Integrate currency USD = **Yes - USD** ✅
- Disclaimer = **"Agreed. We agree all disclaimers of PG regarding Currency = USD. We do not and will not operate in the United States of America."** ✅

> These are already correct in the form. No change needed.

---

## Email Reply (send this to PG Soft)

After fixing the Excel, reply to PG Soft's email with this exact text:

```
Dear KIM / PG Soft Team,

Thank you for the feedback. We have corrected the form as follows:

Part A — SERVER IP (corrected to IPv4 format):
- Test Environment SERVER IP: 172.245.40.68
- Production Environment SERVER IP: 172.245.40.68

Part B — Currency Disclaimer:
We agree all disclaimers of PG regarding Currency = USD.

The corrected form is attached. Please let us know if anything else is needed.

Best regards,
Golden Bounty Team
goldenbountysupport@gmail.com
```

---

## Summary of ALL changes

1. **Sheet "New Integration" → Part 2 (Test Env) → SERVER IP**: `2a06:98c0:3600::103` → `172.245.40.68`
2. **Sheet "New Integration" → Part 3 (Production Env) → SERVER IP**: `2a06:98c0:3600::103` → `172.245.40.68`
3. **Sheet "External API Whitelist" → Downline 1 → Production SERVER IP**: fill `172.245.40.68`
4. **Sheet "External API Whitelist" → Downline 1 → Staging SERVER IP**: fill `172.245.40.68`
5. **Email reply**: "We agree all disclaimers of PG regarding Currency = USD."