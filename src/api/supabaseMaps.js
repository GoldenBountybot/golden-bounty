// Entity name -> Postgres table, and backend function name -> Edge Function slug.
// Keeps the compatibility layer readable and in one place.

export const TABLES = {
  User: 'profiles',
  Profile: 'profiles',
  Wallet: 'wallets',
  Transaction: 'transactions',
  PlayerActivity: 'player_activity',
  PendingRound: 'pending_rounds',
  UserNotification: 'user_notifications',
  SupportMessage: 'support_messages',
  GameSetting: 'game_settings',
  BonusSetting: 'bonus_settings',
  SiteSetting: 'site_settings',
  PaymentAddress: 'payment_addresses',
  Banner: 'banners',
  Avatar: 'avatars',
  TaskLink: 'task_links',
  XPostSubmission: 'x_post_submissions',
  CrashRound: 'crash_rounds',
  SolanaDepositRequest: 'solana_deposit_requests',
  ManualDepositRequest: 'manual_deposit_requests',
  PgSoftSession: 'pgsoft_sessions',
  PgSoftTransaction: 'pgsoft_transactions',
};

export const FUNCTIONS = {
  adminAdjustWallet: 'admin-adjust-wallet',
  assignAvatar: 'assign-avatar',
  beginRound: 'begin-round',
  commitBalanceDelta: 'commit-balance-delta',
  crashRoundTick: 'crash-round-tick',
  creditBonus: 'credit-bonus',
  getCryptoPrices: 'crypto-prices',
  getReferralStats: 'referral-stats',
  getWallet: 'get-wallet',
  jiliLaunchGame: 'jili-launch-game',
  endorphinaLaunchGame: 'endorphina-launch-game',
  getWithdrawalRiskAssessment: 'withdrawal-risk-assessment',
  manualDepositCreate: 'manual-deposit-create',
  manualDepositCheck: 'manual-deposit-check',
  notifyAdminWithdrawal: 'notify-admin-withdrawal',
  solanaRpcProxy: 'solana-rpc-proxy',
  tonconnectManifest: 'tonconnect-manifest',
  pgsoftCashAdjustment: 'pgsoft-cash-adjustment',
  pgsoftCashGet: 'pgsoft-cash-get',
  pgsoftCashTransferInOut: 'pgsoft-cash-transfer',
  pgsoftLaunchGame: 'pgsoft-launch-game',
  pgsoftVerifySession: 'pgsoft-verify-session',
  pollSolanaPayDeposits: 'poll-solana-pay-deposits',
  redeemPromoCode: 'redeem-promo-code',
  settleBet: 'settle-bet',
  stakeOperation: 'stake-operation',
  submitWithdrawal: 'submit-withdrawal',
  telegramAuth: 'telegram-auth',
  verifyEvmDeposit: 'verify-evm-deposit',
  verifyEvmNativeDeposit: 'verify-evm-native-deposit',
  verifyManualDeposit: 'verify-manual-deposit',
  verifySolanaDeposit: 'verify-solana-deposit',
  verifySolanaUsdcDeposit: 'verify-solana-usdc-deposit',
  verifyTonDeposit: 'verify-ton-deposit',
  verifyTonNativeDeposit: 'verify-ton-native-deposit',
};

// Base44 built-in field names mapped to their Supabase column names.
export const FIELD_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  // BOUNTY token balance lives in profiles.tokens
  bounty_allocation: 'tokens',
};

export function toColumn(field) {
  return FIELD_ALIASES[field] || field;
}

// Adds the legacy aliases back onto a row so existing pages keep working.
export function rowOut(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    created_date: row.created_at ?? row.created_date,
    updated_date: row.updated_at ?? row.updated_date,
    created_by_id: row.created_by_id ?? row.user_id,
    // profiles.tokens is the authoritative BOUNTY balance (the legacy
    // bounty_allocation column still exists but is never written anymore).
    bounty_allocation: row.tokens ?? row.bounty_allocation,
  };
}

// Strips legacy/read-only aliases before writing.
export function rowIn(data) {
  const out = { ...(data || {}) };
  delete out.created_date;
  delete out.updated_date;
  delete out.created_by_id;
  // BOUNTY tokens are stored in profiles.tokens; these legacy fields have no column.
  if ('bounty_allocation' in out) {
    out.tokens = out.bounty_allocation;
    delete out.bounty_allocation;
  }
  delete out.bounty_claimed_at;
  return out;
}