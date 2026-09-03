-- =====================================================================
-- Referral commission — database-level safety net
-- =====================================================================
-- Pays the referrer 5% of any deposit, no matter which code path credited
-- it (auto-detect, wallet verify, Solana/TON, admin approval...).
--
-- WHY A TRIGGER (and not editing credit_deposit): this adds a new,
-- independent piece of logic and touches nothing that already works.
-- If anything inside it fails, the exception is swallowed so the deposit
-- itself is NEVER blocked or rolled back.
--
-- NO DOUBLE PAYMENT: every commission writes a transaction row with
-- reference = 'refcom:<deposit reference>'. Both this trigger and the app
-- code use the same key, so whichever runs first wins and the other is a
-- no-op.
--
-- Safe to re-run.

create or replace function public.pay_referral_commission(
  p_depositor uuid,
  p_amount numeric,
  p_reference text
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_ref_id     uuid;
  v_commission numeric;
  v_key        text;
  v_email      text;
  v_from       text;
begin
  if p_amount is null or p_amount <= 0 then return 0; end if;

  select referred_by into v_ref_id from public.profiles where id = p_depositor;
  if v_ref_id is null or v_ref_id = p_depositor then return 0; end if;

  v_commission := round(p_amount * 0.05, 2);
  if v_commission <= 0 then return 0; end if;

  v_key := 'refcom:' || coalesce(nullif(p_reference, ''), p_depositor::text || ':' || p_amount::text);

  -- Already paid for this deposit (by this trigger or by the app) → stop.
  if exists (select 1 from public.transactions where reference = v_key) then
    return 0;
  end if;

  -- The referrer must have a usable (non-banned) wallet.
  if not exists (
    select 1 from public.wallets
    where user_id = v_ref_id and coalesce(banned, false) = false
  ) then
    return 0;
  end if;

  select email into v_email from public.profiles where id = v_ref_id;
  select coalesce(email, '') into v_from from public.profiles where id = p_depositor;

  perform public.wallet_apply_delta(v_ref_id, v_commission);

  insert into public.transactions (user_id, user_email, type, amount, status, method, reference, note)
  values (
    v_ref_id, coalesce(v_email, ''), 'bonus', v_commission, 'completed',
    'referral-commission', v_key,
    '5% commission on $' || to_char(p_amount, 'FM999999990.00') || ' deposit from ' || coalesce(nullif(v_from, ''), 'your referral')
  );

  insert into public.user_notifications (user_id, type, title, body, amount)
  values (
    v_ref_id, 'bonus_arrived', 'Referral commission earned',
    '+$' || to_char(v_commission, 'FM999999990.00') || ' commission from your referral''s deposit',
    v_commission
  );

  return v_commission;
exception when others then
  -- Never let a commission problem affect the deposit.
  return 0;
end $$;

revoke all on function public.pay_referral_commission(uuid, numeric, text) from anon, authenticated;

-- Fires when a deposit is credited (inserted as completed/approved) and when a
-- pending deposit is later approved by an admin.
create or replace function public.t_referral_commission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'deposit' and new.status in ('completed', 'approved') then
    perform public.pay_referral_commission(new.user_id, new.amount, new.reference);
  end if;
  return null;
exception when others then
  return null;
end $$;

drop trigger if exists t_transactions_referral_commission on public.transactions;
create trigger t_transactions_referral_commission
  after insert or update of status on public.transactions
  for each row execute function public.t_referral_commission();