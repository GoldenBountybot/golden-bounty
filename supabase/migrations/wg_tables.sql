-- WG (WG & BDS INFO S.A.) Seamless Wallet: launch sessions + idempotent money txs.
create table if not exists wg_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- sessionId we hand to WG at login; WG echoes it back on every wallet call.
  token text not null unique,
  kind_id text not null default '',
  status text not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists wg_sessions_user_idx on wg_sessions(user_id);

create table if not exists wg_transactions (
  id uuid primary key default gen_random_uuid(),
  -- WG transferId — the idempotency key. A repeat request returns this response
  -- instead of moving money again.
  transfer_id text not null unique,
  kind text not null,                       -- bet_payout | bet | payout | cancel
  user_id uuid,
  account text not null default '',
  session_token text not null default '',
  kind_id text not null default '',
  record_id text not null default '',
  porder_id text not null default '',
  bet_money numeric not null default 0,
  valid_bet numeric not null default 0,
  win numeric not null default 0,
  delta numeric not null default 0,         -- signed wallet change applied
  balance_after numeric not null default 0,
  status text not null default 'ok',        -- ok | cancelled
  response jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wg_tx_user_idx on wg_transactions(user_id);
create index if not exists wg_tx_porder_idx on wg_transactions(porder_id);

alter table wg_sessions enable row level security;
alter table wg_transactions enable row level security;