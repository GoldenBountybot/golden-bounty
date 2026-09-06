# Supabase migration continuity

Requirement: preserve UI, routes, feature behavior, financial rules and formulas. No broad rewrites, deletion of legacy functions, or re-running the entire historical SQL schema against production. This is a source audit, not a certification of deployed behavior.

## Corrected earlier assessment
`src/api/base44Client.js` exports a compatibility object backed by Supabase, NOT the Base44 SDK. Its entities, auth, function invocation and public upload use Supabase. The name `base44` at a call site does not identify its actual hosting provider. Wallet maps to `wallets`; do not assume separate provider and internal wallets. Presence of Base44 function files does not establish active use.

## Completed changes
- Previous turn: created public.agent_profiles remotely, with public read/admin write rules and updated_at trigger; added AgentProfile mapping and historical schema definition. Legacy AgentProfile query returned zero records; no agent data was copied. Live role records/country tags have not been reconciled.
- This turn: Game Stats and Provider Report now use the existing Supabase entity adapter instead of nonexistent frontend asServiceRole. Added optional skip/range support to list calls, with ID tie-breaker for paginated reads. Existing two-argument list calls, aggregation formulas and report caps remain unchanged.
- This turn: notification helper translates broadcast recipient empty string to SQL NULL as required by the Supabase schema. Individual recipients, contents and UI are unchanged.
- This turn: added the Supabase `withdrawal-risk-assessment` Edge Function source used by the existing admin Risk Assessment panel. Admin authentication, transaction/activity limits, every flag threshold, risk weights, summary bands and response fields match the legacy function.
- Supabase OAuth inspection confirmed the correct `Golden Bounty` project is ACTIVE_HEALTHY and its existing `withdrawal-risk-assessment` function is ACTIVE at version 35. The downloaded deployed bundle contains the matching risk labels, threshold checks, table names and summary text, so the active function was preserved rather than replaced unnecessarily.
- Supabase OAuth inspection also confirmed all 36 Edge Function slugs referenced by `FUNCTIONS` are deployed and ACTIVE. No mapped slug is missing. The additional 21 provider/bot functions were classified as direct callbacks, provider aliases, bot delivery, agent/support endpoints or scheduled functions and were preserved.

## Production parity verified read-only
- AuthContext and Telegram login use Supabase sessions; wallet/game/admin calls resolve to Supabase tables and Edge Functions.
- All 21 mapped tables exist with RLS and policies. Production has 32 public tables, 60 policies across 22 tables, 16 enabled application triggers, 36 public routines and four realtime tables.
- All 57 deployed Edge Functions are ACTIVE. No function bundle references another Supabase project. The two `base44.app` strings are only the published app URL used by Telegram/Endorphina navigation, not Base44 data or function calls.
- The 21 additional provider/bot functions are intentional direct callbacks, bot delivery, provider aliases or agent/support endpoints and remain unchanged.
- Supabase cron is installed with active crash-round, Solana Pay polling and free-spin reminder jobs. Because Supabase already polls Solana Pay, the duplicate Base44 `Solana Pay Deposit Poller` workflow was deactivated without changing the active Supabase job.
- The `media` bucket is public by design and is used by current banner/QR/avatar uploads. No confirmed private-file caller was found, so storage behavior was not changed.
- Legacy-versus-Supabase counts were compared without reading or changing financial values. Supabase contains newer profiles, wallets, transactions, activities, sessions and notifications; copying legacy records would duplicate or overwrite live data, so no records were migrated again.

## Intentionally unchanged safeguards
- Existing formulas, report caps, adapter semantics, RLS, financial routines, provider callbacks, JWT settings, UI and routes were not altered.
- ForgotPassword/ResetPassword remain outside the current Telegram-first route flow; Supabase Auth currently has a localhost site URL, so enabling that flow requires a separately approved authentication change.
- AdminFinance still requests up to 5000 records; Game Stats and Provider Report retain their existing safety caps.
- `UploadPrivateFile` remains an unused compatibility alias; it must not be changed until a real private-file consumer and private bucket are introduced.
- Complete interactive regression testing remains a separate Testing Agent task. No production transaction, balance update, broadcast or provider callback was issued during this audit.