-- =====================================================================
-- Golden Bounty — Supabase (PostgreSQL) schema
-- Base44 entities → Postgres tables, 1:1 conversion.
--
-- HOW TO USE:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- NOTES:
--   * Base44 built-ins map like this:
--       id              -> id uuid primary key default gen_random_uuid()
--       created_date    -> created_at timestamptz default now()
--       updated_date    -> updated_at timestamptz default now()  (auto-updated by trigger)
--       created_by_id   -> created_by uuid references auth.users(id)
--   * Base44's User entity = Supabase auth.users + the public.profiles table below.
--   * "admin" role = profiles.role = 'admin'. Helper fn public.is_admin() used in policies.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- PROFILES  (Base44 User entity)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  role          text not null default 'user' check (role in ('user','admin')),
  avatar_url    text default '',
  x_username    text default '',
  promo_welcome_seen boolean not null default false,
  referred_by   uuid references auth.users(id),
  tokens        numeric not null default 0,          -- BOUNTY tokens (airdrop/tasks)
  staked_amount numeric not null default 0,          -- display mirror only
  staked_at     timestamptz,
  last_profit_claim timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists t_profiles_touch on public.profiles;
create trigger t_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists t_on_auth_user_created on auth.users;
create trigger t_on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check helper (security definer so it bypasses RLS on profiles).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- WALLET  (authoritative money — users read only, никто writes but service role/admin)
-- ---------------------------------------------------------------------
create table if not exists public.wallets (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  balance               numeric not null default 0,
  wager_remaining       numeric not null default 0,
  staked_amount         numeric not null default 0,
  staked_at             timestamptz,
  last_profit_claim     timestamptz,
  cashback_claimed_loss numeric not null default 0,
  banned                boolean not null default false,
  rtp                   numeric,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists ix_wallets_user on public.wallets(user_id);
drop trigger if exists t_wallets_touch on public.wallets;
create trigger t_wallets_touch before update on public.wallets
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- TRANSACTIONS  (deposit / withdraw / bonus / adjustment)
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_email text default '',
  type       text not null default 'deposit' check (type in ('deposit','withdraw','bonus','adjustment')),
  amount     numeric not null default 0,
  status     text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  method     text default 'stripe',
  reference  text default '',
  note       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_tx_user on public.transactions(user_id, created_at desc);
create index if not exists ix_tx_status on public.transactions(status);
drop trigger if exists t_tx_touch on public.transactions;
create trigger t_tx_touch before update on public.transactions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- PENDING ROUNDS  (server-authoritative bet rounds)
-- ---------------------------------------------------------------------
create table if not exists public.pending_rounds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  round_token  text not null unique,
  game_id      text not null,
  bet_amount   numeric not null default 0,
  win_amount   numeric not null default 0,
  is_free_spin boolean not null default false,
  settle_mode  text not null default 'fixed' check (settle_mode in ('fixed','cap')),
  status       text not null default 'pending' check (status in ('pending','settled','expired')),
  settle_claim text default '',
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ix_pr_token on public.pending_rounds(round_token);
create index if not exists ix_pr_user on public.pending_rounds(user_id, status);
drop trigger if exists t_pr_touch on public.pending_rounds;
create trigger t_pr_touch before update on public.pending_rounds
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- PLAYER ACTIVITY  (bet history / game stats)
-- ---------------------------------------------------------------------
create table if not exists public.player_activity (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_email text default '',
  game_id    text not null,
  bet        numeric not null default 0,
  win        numeric not null default 0,
  outcome    text not null default 'loss' check (outcome in ('win','loss','push')),
  multiplier numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ix_pa_user on public.player_activity(user_id, created_at desc);
create index if not exists ix_pa_game on public.player_activity(game_id, created_at desc);

-- ---------------------------------------------------------------------
-- GAME SETTINGS  (rtp / limits per game, '*' = global default)
-- ---------------------------------------------------------------------
create table if not exists public.game_settings (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null unique,
  game_name  text not null,
  rtp        numeric not null default 50,
  demo_rtp   numeric not null default 50,
  enabled    boolean not null default true,
  min_bet    numeric not null default 1,
  max_bet    numeric not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists t_gs_touch on public.game_settings;
create trigger t_gs_touch before update on public.game_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- CRASH ROUND  (live singleton round for Rocket Crash)
-- ---------------------------------------------------------------------
create table if not exists public.crash_rounds (
  id               uuid primary key default gen_random_uuid(),
  current          boolean not null default true,
  round_id         bigint not null default 1,
  phase            text not null default 'waiting' check (phase in ('waiting','running','crashed')),
  crash_point      numeric not null default 1,
  wait_start       bigint not null default 0,
  run_start        bigint not null default 0,
  crash_at         bigint not null default 0,
  final_multiplier numeric not null default 1,
  history          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
drop trigger if exists t_cr_touch on public.crash_rounds;
create trigger t_cr_touch before update on public.crash_rounds
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- PAYMENT ADDRESSES  (deposit wallets shown to users)
-- ---------------------------------------------------------------------
create table if not exists public.payment_addresses (
  id           uuid primary key default gen_random_uuid(),
  method       text not null check (method in ('usdt','crypto','binance')),
  network      text not null,
  label        text not null,
  address      text default '',
  qr_image_url text default '',
  symbol       text default '',
  color        text default '',
  active       boolean not null default true,
  "order"      int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists t_pad_touch on public.payment_addresses;
create trigger t_pad_touch before update on public.payment_addresses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- SOLANA PAY DEPOSIT REQUESTS
-- ---------------------------------------------------------------------
create table if not exists public.solana_deposit_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_email text default '',
  amount     numeric not null,
  pay_units  bigint not null unique,
  status     text not null default 'pending' check (status in ('pending','completed')),
  signature  text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_sdr_status on public.solana_deposit_requests(status);
drop trigger if exists t_sdr_touch on public.solana_deposit_requests;
create trigger t_sdr_touch before update on public.solana_deposit_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- PG SOFT — sessions + transactions (Seamless Wallet)
-- ---------------------------------------------------------------------
create table if not exists public.pgsoft_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  session_token text not null unique,
  game_id       text default '',
  status        text not null default 'active' check (status in ('active','expired')),
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ix_pgs_token on public.pgsoft_sessions(session_token);

create table if not exists public.pgsoft_transactions (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  text not null unique,          -- idempotency key
  user_id         uuid not null references auth.users(id) on delete cascade,
  kind            text not null default 'bet_payout' check (kind in ('bet_payout','adjustment')),
  game_id         text default '',
  bet_id          text default '',
  parent_bet_id   text default '',
  bet_amount      numeric not null default 0,
  win_amount      numeric not null default 0,
  transfer_amount numeric not null default 0,
  balance_after   numeric not null default 0,
  updated_time    bigint  not null default 0,
  status          text not null default 'success' check (status in ('success','failed')),
  created_at      timestamptz not null default now()
);
create index if not exists ix_pgt_txid on public.pgsoft_transactions(transaction_id);
create index if not exists ix_pgt_user on public.pgsoft_transactions(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS  (user_id NULL = broadcast to everyone)
-- ---------------------------------------------------------------------
create table if not exists public.user_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  type       text not null default 'system' check (type in (
               'bonus_arrived','bonus_claimed','cashback_claimed','token_claimed',
               'deposit_approved','withdraw_approved','withdraw_requested','system')),
  title      text not null,
  body       text default '',
  amount     numeric not null default 0,
  link       text default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ix_un_user on public.user_notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- SUPPORT MESSAGES  (live chat + bot handoff)
-- ---------------------------------------------------------------------
create table if not exists public.support_messages (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  user_email        text default '',
  sender            text not null default 'user' check (sender in ('user','admin','bot')),
  text              text not null,
  kind              text not null default 'message' check (kind in ('message','agent_request','agent_connected','agent_ended')),
  show_agent_button boolean not null default false,
  read              boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists ix_sm_user on public.support_messages(user_id, created_at);

-- ---------------------------------------------------------------------
-- CONTENT / CONFIG  (banners, site settings, bonuses, tasks, avatars)
-- ---------------------------------------------------------------------
create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  image_url   text default '',
  link        text default '',
  link_label  text default '',
  active      boolean not null default true,
  "order"     int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  image_url  text default '',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_settings (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,     -- signup | daily | monthly | deposit
  label           text default '',
  amount          numeric not null default 0,
  deposit_percent numeric not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.task_links (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  label      text not null,
  url        text not null,
  reward     numeric not null default 5,
  active     boolean not null default true,
  "order"    int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avatars (
  id          uuid primary key default gen_random_uuid(),
  gender      text not null check (gender in ('male','female')),
  image_url   text not null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists ix_av_free on public.avatars(gender) where assigned_to is null;

create table if not exists public.x_post_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_email  text default '',
  x_username  text not null,
  post_link   text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  reward      numeric not null default 10,
  claimed     boolean not null default false,
  reviewed_at timestamptz,
  admin_note  text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ix_xps_user on public.x_post_submissions(user_id, created_at desc);

-- =====================================================================
-- ATOMIC MONEY HELPERS  (replaces Base44 $inc — run as service role only)
-- =====================================================================

-- Atomically add a signed delta to a wallet. Refuses to go negative.
create or replace function public.wallet_apply_delta(p_user uuid, p_delta numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_new numeric;
begin
  update public.wallets
     set balance = balance + p_delta
   where user_id = p_user
     and (p_delta >= 0 or balance + p_delta >= -0.000001)
  returning balance into v_new;
  if v_new is null then
    raise exception 'insufficient_balance_or_missing_wallet';
  end if;
  return round(v_new::numeric, 8);
end $$;
revoke all on function public.wallet_apply_delta(uuid, numeric) from anon, authenticated;

-- Deduct a bet atomically and open the round in one transaction.
create or replace function public.wallet_place_bet(
  p_user uuid, p_token text, p_game text, p_bet numeric,
  p_win numeric, p_free boolean, p_mode text, p_expires timestamptz)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_new numeric;
begin
  if not p_free then
    v_new := public.wallet_apply_delta(p_user, -p_bet);
    update public.wallets
       set wager_remaining = greatest(0, wager_remaining - p_bet)
     where user_id = p_user;
  else
    select balance into v_new from public.wallets where user_id = p_user;
  end if;

  insert into public.pending_rounds
    (user_id, round_token, game_id, bet_amount, win_amount, is_free_spin, settle_mode, status, expires_at)
  values (p_user, p_token, p_game, p_bet, p_win, p_free, p_mode, 'pending', p_expires);

  return v_new;
end $$;
revoke all on function public.wallet_place_bet(uuid, text, text, numeric, numeric, boolean, text, timestamptz) from anon, authenticated;

-- Settle a round exactly once (atomic claim → credit → mark settled).
create or replace function public.wallet_settle_round(p_token text, p_client_win numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_win numeric; v_bal numeric;
begin
  update public.pending_rounds
     set status = 'settled'
   where round_token = p_token and status = 'pending'
  returning * into r;

  if r is null then
    return jsonb_build_object('ok', false, 'reason', 'already_settled_or_missing');
  end if;

  v_win := case when r.settle_mode = 'cap'
                then least(coalesce(p_client_win, 0), r.win_amount)
                else r.win_amount end;

  if v_win > 0 then
    v_bal := public.wallet_apply_delta(r.user_id, v_win);
  else
    select balance into v_bal from public.wallets where user_id = r.user_id;
  end if;

  return jsonb_build_object('ok', true, 'win', v_win, 'balance', v_bal);
end $$;
revoke all on function public.wallet_settle_round(text, numeric) from anon, authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.wallets                 enable row level security;
alter table public.transactions            enable row level security;
alter table public.pending_rounds          enable row level security;
alter table public.player_activity         enable row level security;
alter table public.game_settings           enable row level security;
alter table public.crash_rounds            enable row level security;
alter table public.payment_addresses       enable row level security;
alter table public.solana_deposit_requests enable row level security;
alter table public.pgsoft_sessions         enable row level security;
alter table public.pgsoft_transactions     enable row level security;
alter table public.user_notifications      enable row level security;
alter table public.support_messages        enable row level security;
alter table public.banners                 enable row level security;
alter table public.site_settings           enable row level security;
alter table public.bonus_settings          enable row level security;
alter table public.task_links              enable row level security;
alter table public.avatars                 enable row level security;
alter table public.x_post_submissions      enable row level security;

-- PROFILES: own row read/update; admins everything.
drop policy if exists p_profiles_sel on public.profiles;
create policy p_profiles_sel on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists p_profiles_upd on public.profiles;
create policy p_profiles_upd on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- WALLETS: read own; NO client writes at all (service role only).
drop policy if exists p_wallets_sel on public.wallets;
create policy p_wallets_sel on public.wallets for select
  using (user_id = auth.uid() or public.is_admin());

-- TRANSACTIONS: read own; user may only insert a pending deposit.
drop policy if exists p_tx_sel on public.transactions;
create policy p_tx_sel on public.transactions for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_tx_ins on public.transactions;
create policy p_tx_ins on public.transactions for insert
  with check (public.is_admin() or (user_id = auth.uid() and type = 'deposit' and status = 'pending'));
drop policy if exists p_tx_upd on public.transactions;
create policy p_tx_upd on public.transactions for update using (public.is_admin());

-- PENDING ROUNDS: read own only; writes are service-role only.
drop policy if exists p_pr_sel on public.pending_rounds;
create policy p_pr_sel on public.pending_rounds for select
  using (user_id = auth.uid() or public.is_admin());

-- PLAYER ACTIVITY: insert own, read own.
drop policy if exists p_pa_sel on public.player_activity;
create policy p_pa_sel on public.player_activity for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_pa_ins on public.player_activity;
create policy p_pa_ins on public.player_activity for insert
  with check (user_id = auth.uid() or public.is_admin());

-- PG SOFT: read own rows; all writes service-role only.
drop policy if exists p_pgs_sel on public.pgsoft_sessions;
create policy p_pgs_sel on public.pgsoft_sessions for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_pgt_sel on public.pgsoft_transactions;
create policy p_pgt_sel on public.pgsoft_transactions for select
  using (user_id = auth.uid() or public.is_admin());

-- SOLANA DEPOSIT REQUESTS: create + read own.
drop policy if exists p_sdr_sel on public.solana_deposit_requests;
create policy p_sdr_sel on public.solana_deposit_requests for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_sdr_ins on public.solana_deposit_requests;
create policy p_sdr_ins on public.solana_deposit_requests for insert
  with check (user_id = auth.uid());

-- NOTIFICATIONS: own + broadcasts.
drop policy if exists p_un_sel on public.user_notifications;
create policy p_un_sel on public.user_notifications for select
  using (user_id = auth.uid() or user_id is null or public.is_admin());
drop policy if exists p_un_ins on public.user_notifications;
create policy p_un_ins on public.user_notifications for insert
  with check (public.is_admin() or user_id = auth.uid());
drop policy if exists p_un_upd on public.user_notifications;
create policy p_un_upd on public.user_notifications for update
  using (user_id = auth.uid() or public.is_admin());

-- SUPPORT MESSAGES: own thread; admins all.
drop policy if exists p_sm_sel on public.support_messages;
create policy p_sm_sel on public.support_messages for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_sm_ins on public.support_messages;
create policy p_sm_ins on public.support_messages for insert
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists p_sm_upd on public.support_messages;
create policy p_sm_upd on public.support_messages for update using (public.is_admin());

-- X POST SUBMISSIONS: own create/read/update; admin all.
drop policy if exists p_xps_sel on public.x_post_submissions;
create policy p_xps_sel on public.x_post_submissions for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_xps_ins on public.x_post_submissions;
create policy p_xps_ins on public.x_post_submissions for insert
  with check (user_id = auth.uid());
drop policy if exists p_xps_upd on public.x_post_submissions;
create policy p_xps_upd on public.x_post_submissions for update
  using (user_id = auth.uid() or public.is_admin());

-- PUBLIC-READ CONFIG TABLES: anyone reads, admins write.
do $$
declare t text;
begin
  foreach t in array array['game_settings','crash_rounds','payment_addresses',
                           'banners','site_settings','bonus_settings','task_links','avatars']
  loop
    execute format('drop policy if exists p_%s_sel on public.%I', t, t);
    execute format('create policy p_%s_sel on public.%I for select using (true)', t, t);
    execute format('drop policy if exists p_%s_ins on public.%I', t, t);
    execute format('create policy p_%s_ins on public.%I for insert with check (public.is_admin())', t, t);
    execute format('drop policy if exists p_%s_upd on public.%I', t, t);
    execute format('create policy p_%s_upd on public.%I for update using (public.is_admin())', t, t);
    execute format('drop policy if exists p_%s_del on public.%I', t, t);
    execute format('create policy p_%s_del on public.%I for delete using (public.is_admin())', t, t);
  end loop;
end $$;

-- =====================================================================
-- REALTIME  (Crash game, support chat, notifications, wallet balance)
-- =====================================================================
alter publication supabase_realtime add table public.crash_rounds;
alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.user_notifications;
alter publication supabase_realtime add table public.wallets;

-- =====================================================================
-- SEED  (global RTP default + bonus rows)
-- =====================================================================
insert into public.game_settings (game_id, game_name, rtp, demo_rtp)
values ('*', 'Global Default', 50, 50)
on conflict (game_id) do nothing;

insert into public.bonus_settings (name, label, amount, deposit_percent, active) values
  ('signup',  'Signup Bonus',  0, 0,   true),
  ('daily',   'Daily Bonus',   0, 0,   true),
  ('monthly', 'Monthly Bonus', 0, 0,   true),
  ('deposit', 'Deposit Bonus', 0, 0,   true)
on conflict (name) do nothing;