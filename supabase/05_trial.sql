-- ═══════════════════════════════════════════════════════════════
--  Khedmti — تجربة مجانية 14 يوم
--  SQL Editor → الصق كامل → Run
-- ═══════════════════════════════════════════════════════════════
--  • كل حساب جديد يبدا بخطة trial تنتهي بعد 14 يوم
--  • الحسابات الموجودة من قبل ما تتبدّلش (تبقى free)
--  • بعد 14 يوم الحساب يتوقف حتى تسجّل له دفعة من لوحة الأدمين
-- ═══════════════════════════════════════════════════════════════

-- ── 1. التسجيل: يبدا بتجربة 14 يوم ────────────────────────────
create or replace function api_register(
  p_name text, p_email text, p_password text,
  p_phone text default '', p_type text default 'agency', p_ref text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a agencies; tok uuid; referrer uuid;
begin
  p_email := lower(trim(p_email));
  if length(coalesce(p_password,'')) < 4 then raise exception 'weak_password'; end if;
  if exists (select 1 from agencies where email = p_email) then
    raise exception 'duplicate_email';
  end if;

  if p_ref is not null and length(trim(p_ref)) > 0 then
    select id into referrer from agencies where ref_code = lower(trim(p_ref));
  end if;

  insert into agencies (name, email, password_hash, pw_hash, phone, account_type,
                        ref_code, referred_by, plan, plan_expires_at)
  values (trim(p_name), p_email, '', crypt(p_password, gen_salt('bf', 10)),
          trim(coalesce(p_phone,'')), coalesce(p_type,'agency'),
          lower(substr(md5(gen_random_uuid()::text), 1, 7)), referrer,
          'trial', now() + interval '14 days')
  returning * into a;

  insert into app_data (agency_id, data)
  values (a.id, '{"editors":[],"clients":[],"videos":[],"invoices":[],"tasks":[]}'::jsonb);

  insert into sessions (agency_id) values (a.id) returning token into tok;
  return jsonb_build_object('token', tok, 'agency', agency_public(a));
end $$;
grant execute on function api_register(text,text,text,text,text,text) to anon;

-- ── 2. حالة الحساب الحالية (باش الدفعة تبان بلا ما يعاود يدخل) ──
create or replace function api_me(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ag uuid; a agencies;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  select * into a from agencies where id = ag;
  return agency_public(a);
end $$;
grant execute on function api_me(uuid) to anon;

-- ── 3. المسوّقين: اللي في التجربة ما يتحسبش "يدفع" ─────────────
create or replace function api_admin_affiliates(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare rows jsonb; r numeric;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  select rate into r from affiliate_config where id = 1;

  select coalesce(jsonb_agg(x order by x.pending_count desc, x.referrals desc), '[]'::jsonb) into rows
  from (
    select a.id, a.name, a.email, a.ref_code,
      (select count(*) from agencies b where b.referred_by = a.id) as referrals,
      (select count(*) from agencies b where b.referred_by = a.id and b.plan not in ('free','trial')) as paying,
      (select coalesce(jsonb_object_agg(currency, s), '{}'::jsonb) from
        (select currency, sum(amount) s from commissions
          where affiliate_id = a.id and status = 'pending' group by currency) p) as pending,
      (select coalesce(jsonb_object_agg(currency, s), '{}'::jsonb) from
        (select currency, sum(amount) s from commissions
          where affiliate_id = a.id and status = 'paid' group by currency) q) as paid,
      (select count(*) from commissions where affiliate_id = a.id and status = 'pending') as pending_count
    from agencies a
    where exists (select 1 from agencies b where b.referred_by = a.id)
  ) x;

  return jsonb_build_object('rate', r, 'rows', rows);
end $$;
grant execute on function api_admin_affiliates(uuid) to anon;

notify pgrst, 'reload schema';
