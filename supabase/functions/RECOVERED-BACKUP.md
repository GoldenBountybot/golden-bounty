# Recovered edge function sources (backup)

The 27 functions below were NOT present in this repository — their code
lived only on Supabase. This folder is a backup of their deployed code,
recovered from the live deployment on 2026-09-09.

The DEPLOYED functions on Supabase remain the source of truth until a
function is redeployed from this repository.

Recovered functions:
- telegram-auth
- begin-round
- settle-bet
- stake-operation
- submit-withdrawal
- verify-manual-deposit
- get-wallet
- verify-solana-deposit
- verify-solana-usdc-deposit
- verify-ton-deposit
- verify-ton-native-deposit
- admin-adjust-wallet
- poll-solana-pay-deposits
- credit-bonus
- commit-balance-delta
- redeem-promo-code
- referral-stats
- assign-avatar
- crash-round-tick
- crypto-prices
- support-bot
- auth
- bet
- cancelBet
- sessionBet
- cancelSessionBet
- agent-ops

Notes:
- telegram-auth/index.ts — stored copy was missing its first 2 bytes ("co" of "const"); restored
