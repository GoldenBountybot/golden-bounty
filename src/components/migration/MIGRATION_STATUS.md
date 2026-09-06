# Supabase migration continuity

Requirement: preserve UI, routes, feature behavior, financial rules and formulas. No broad rewrites, deletion of legacy functions, or re-running the entire historical SQL schema against production. This is a source audit, not a certification of deployed behavior.

## Corrected earlier assessment
`src/api/base44Client.js` exports a compatibility object backed by Supabase, NOT the Base44 SDK. Its entities, auth, function invocation and public upload use Supabase. The name `base44` at a call site does not identify its actual hosting provider. Wallet maps to `wallets`; do not assume separate provider and internal wallets. Presence of Base44 function files does not establish active use.

## Completed changes
- Previous turn: created public.agent_profiles remotely, with public read/admin write rules and updated_at trigger; added AgentProfile mapping and historical schema definition. Legacy AgentProfile query returned zero records; no agent data was copied. Live role records/country tags have not been reconciled.
- This turn: Game Stats and Provider Report now use the existing Supabase entity adapter instead of nonexistent frontend asServiceRole. Added optional skip/range support to list calls, with ID tie-breaker for paginated reads. Existing two-argument list calls, aggregation formulas and report caps remain unchanged.
- This turn: notification helper translates broadcast recipient empty string to SQL NULL as required by the Supabase schema. Individual recipients, contents and UI are unchanged.
- This turn: added the Supabase `withdrawal-risk-assessment` Edge Function source used by the existing admin Risk Assessment panel. Admin authentication, transaction/activity limits, every flag threshold, risk weights, summary bands and response fields match the legacy function. This source change is not evidence that the Edge Function has been deployed to the remote Supabase project.

## Source traced, deployment not certified
- AuthContext and Telegram login use Supabase sessions; Register redirects to Login intentionally.
- Wallet/game calls resolve through FUNCTIONS mappings to Supabase Edge Function slugs.
- Admin Players uses profiles/wallets and admin-adjust-wallet via adapter.
- TaskSystem and XPostTask use Supabase through adapter; reward formulas untouched.
- Support bot calls support-bot directly; support messages and realtime use Supabase adapter.
- Public file upload targets Supabase media bucket.

## Remaining inventory / parity work — do not mark complete
- Compare every FUNCTIONS slug with deployed Edge Functions, including underlying shared helpers, provider callbacks, Telegram delivery and financial authorization/atomicity.
- Search remaining frontend consumers for direct SDK imports, asServiceRole, unsupported methods and direct Base44 URLs; current source review is partial.
- Inventory actual use of unsupported InvokeLLM, SendEmail, GenerateImage, extraction, signed URLs, invitations and no-op analytics. Do not add new services for unused methods.
- UploadPrivateFile currently aliases PUBLIC upload: inspect consumers and existing storage before implementing private storage; do not silently publish private files.
- Audit schema/column parity and production permissions; historical SQL is not evidence of current production schema.
- AdminFinance requests 5000 records in one call; assess production API row cap before claiming report completeness. Existing Game Stats cap is 5500 and Provider Report cap is 10500; preserve unless separately authorized.
- Audit null filters, logical filters, updateMany/schema and other adapter methods only against actual callers.
- Inventory workflows, schedules, cron jobs, triggers, webhooks, realtime publications, storage/assets and external URLs; compare with active production configuration.
- ForgotPassword/ResetPassword exist but are not routed by the current App source and call methods absent from the Supabase auth adapter. Current app is Telegram-only; do not change login flow speculatively.
- Reconcile legacy data counts and IDs before any data migration; never overwrite live wallets or duplicate financial transactions.
- Regression verification of complete user flows remains pending. No production transactions or broadcasts were issued in this turn.

## Access note
Supabase connector info was retrieved this turn: no active OAuth connector. Existing secret credentials are listed in the workspace; prior successful secret-based calls do not establish current connector authorization. Further connector-managed deployment inspection requires the authorized connection flow.