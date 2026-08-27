-- JILI Seamless Wallet integration tables.
-- jili_sessions: the player token we issue at game launch (JILI sends it back
-- on /auth and every bet). jili_transactions: idempotency ledger — every money
-- move claims a unique tx_key first, so a JILI retry can never double-pay.

create table if not exists public.jili_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_token text not null unique,
  game_id integer not null default 0,
  status text not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jili_sessions_user_idx on public.jili_sessions (user_id);

create table if not exists public.jili_transactions (
  id bigserial primary key,
  tx_key text not null unique,
  kind text not null,
  user_id uuid not null,
  game integer not null default 0,
  bet_amount numeric not null default 0,
  winlose_amount numeric not null default 0,
  delta numeric not null default 0,
  balance_after numeric,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create index if not exists jili_transactions_user_idx on public.jili_transactions (user_id);

-- Service role only: these rows are written exclusively by the JILI callbacks.
alter table public.jili_sessions enable row level security;
alter table public.jili_transactions enable row level security;