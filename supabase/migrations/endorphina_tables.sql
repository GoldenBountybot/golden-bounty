-- Endorphina Seamless Wallet: launch sessions + idempotent money transactions.
create table if not exists endorphina_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  game text not null default '',
  currency text not null default 'USD',
  status text not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists endorphina_sessions_user_idx on endorphina_sessions(user_id);

create table if not exists endorphina_transactions (
  id uuid primary key default gen_random_uuid(),
  -- Endorphina transaction id ("id" param). Unique per kind so a bet and a win
  -- may share an id without colliding.
  provider_id text not null,
  kind text not null,                       -- bet | win | refund | promoWin
  user_id uuid,
  token text not null default '',
  game text not null default '',
  game_id text not null default '',
  amount numeric not null default 0,        -- in currency units (not thousandths)
  balance_after numeric not null default 0,
  status text not null default 'ok',        -- ok | cancelled
  response jsonb,
  created_at timestamptz not null default now(),
  unique (provider_id, kind)
);
create index if not exists endorphina_tx_user_idx on endorphina_transactions(user_id);

alter table endorphina_sessions enable row level security;
alter table endorphina_transactions enable row level security;