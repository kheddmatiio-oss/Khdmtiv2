-- ═══════════════════════════════════════════════════════════════
--  Khedmti — التسويق بالعمولة (+ إعادة تعيين كلمة السر)
--  SQL Editor → الصق كامل → Run
-- ═══════════════════════════════════════════════════════════════
--  • كل حساب عندو رمز إحالة: khedmti.app/?ref=xxxxxxx
--  • اللي يسجّل من الرابط يتحسب للمسوّق
--  • كل دفعة يسجّلها المدير لحساب مُحال = عمولة للمسوّق (كل تجديد)
--  • الدفع للمسوّق يدوي: المدير يعلّم العمولات "مدفوعة"
-- ═══════════════════════════════════════════════════════════════

-- ── 1. الإحالة على الحسابات ────────────────────────────────────
alter table agencies add column if not exists ref_code text;
alter table agencies add column if not exists referred_by uuid references agencies(id) on delete set null;

update agencies set ref_code = lower(substr(md5(id::text || 'khedmti'), 1, 7))
 where ref_code is null;
create unique index if not exists agencies_ref_code_uniq on agencies(ref_code);
create index if not exists agencies_referred_by_idx on agencies(referred_by);

-- ── 2. الإعداد: نسبة العمولة (سطر واحد) ─────────────────────────
create table if not exists affiliate_config (
  id   int primary key default 1 check (id = 1),
  rate numeric not null default 30 check (rate >= 0 and rate <= 100)
);
insert into affiliate_config (id) values (1) on conflict do nothing;

-- ── 3. الدفعات والعمولات ──────────────────────────────────────
create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references agencies(id) on delete cascade,
  amount     numeric not null check (amount >= 0),
  currency   text not null default 'DZD',
  plan       text not null,
  days       int  not null,
  created_at timestamptz not null default now()
);

create table if not exists commissions (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references agencies(id) on delete cascade,
  agency_id    uuid not null references agencies(id) on delete cascade,
  payment_id   uuid not null references payments(id) on delete cascade,
  amount       numeric not null,
  currency     text not null,
  rate         numeric not null,           -- النسبة وقت الدفع، باش التبديل ما يعاودش يحسب القديم
  status       text not null default 'pending' check (status in ('pending','paid')),
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index if not exists commissions_affiliate_idx on commissions(affiliate_id, status);

alter table affiliate_config enable row level security;
alter table payments         enable row level security;
alter table commissions      enable row level security;

-- ── 4. التسجيل يقبل رمز الإحالة ───────────────────────────────
drop function if exists api_register(text,text,text,text,text);
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

  -- رمز غالط ولا ناقص ما يمنعش التسجيل — يتجاهل برك
  if p_ref is not null and length(trim(p_ref)) > 0 then
    select id into referrer from agencies where ref_code = lower(trim(p_ref));
  end if;

  insert into agencies (name, email, password_hash, pw_hash, phone, account_type, ref_code, referred_by)
  values (trim(p_name), p_email, '', crypt(p_password, gen_salt('bf', 10)),
          trim(coalesce(p_phone,'')), coalesce(p_type,'agency'),
          lower(substr(md5(gen_random_uuid()::text), 1, 7)), referrer)
  returning * into a;

  insert into app_data (agency_id, data)
  values (a.id, '{"editors":[],"clients":[],"videos":[],"invoices":[],"tasks":[]}'::jsonb);

  insert into sessions (agency_id) values (a.id) returning token into tok;
  return jsonb_build_object('token', tok, 'agency', agency_public(a));
end $$;
grant execute on function api_register(text,text,text,text,text,text) to anon;

-- ── 5. المسوّق: رابطو ونتائجو ─────────────────────────────────
create or replace function api_affiliate_me(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ag uuid; me agencies; r numeric;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  select * into me from agencies where id = ag;
  select rate into r from affiliate_config where id = 1;

  return jsonb_build_object(
    'code', me.ref_code,
    'rate', r,
    -- الاسم والخطة برك — ماشي الإيميل ولا الهاتف
    'referrals', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', a.name, 'plan', a.plan, 'created_at', a.created_at)
             order by a.created_at desc), '[]'::jsonb)
        from agencies a where a.referred_by = ag),
    'commissions', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', c.id, 'name', a.name, 'amount', c.amount, 'currency', c.currency,
               'rate', c.rate, 'status', c.status, 'created_at', c.created_at, 'paid_at', c.paid_at)
             order by c.created_at desc), '[]'::jsonb)
        from commissions c join agencies a on a.id = c.agency_id
       where c.affiliate_id = ag)
  );
end $$;
grant execute on function api_affiliate_me(uuid) to anon;

-- ── 6. المدير: تسجيل دفعة (تفعيل/تجديد + عمولة تلقائية) ─────────
create or replace function api_admin_record_payment(
  p_token uuid, p_agency uuid, p_amount numeric, p_currency text, p_plan text, p_days int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ref uuid; pid uuid; r numeric; c commissions;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'bad_amount'; end if;
  if p_plan not in ('basic','pro') then raise exception 'bad_plan'; end if;
  if p_days is null or p_days <= 0 then raise exception 'bad_days'; end if;

  -- التجديد يمدّد من تاريخ الانتهاء الحالي، ماشي من اليوم
  update agencies
     set plan = p_plan, is_active = true,
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + make_interval(days => p_days)
   where id = p_agency
   returning referred_by into ref;

  insert into payments (agency_id, amount, currency, plan, days)
  values (p_agency, p_amount, coalesce(nullif(p_currency,''),'DZD'), p_plan, p_days)
  returning id into pid;

  if ref is not null and p_amount > 0 then
    select rate into r from affiliate_config where id = 1;
    insert into commissions (affiliate_id, agency_id, payment_id, amount, currency, rate)
    values (ref, p_agency, pid, round(p_amount * r / 100, 2), coalesce(nullif(p_currency,''),'DZD'), r)
    returning * into c;
  end if;

  return jsonb_build_object('payment_id', pid, 'commission', to_jsonb(c));
end $$;
grant execute on function api_admin_record_payment(uuid,uuid,numeric,text,text,int) to anon;

-- ── 7. المدير: قائمة المسوّقين ─────────────────────────────────
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
      (select count(*) from agencies b where b.referred_by = a.id and b.plan <> 'free') as paying,
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

-- ── 8. المدير: تعليم العمولات مدفوعة ─────────────────────────
create or replace function api_admin_affiliate_paid(p_token uuid, p_affiliate uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  update commissions set status = 'paid', paid_at = now()
   where affiliate_id = p_affiliate and status = 'pending';
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function api_admin_affiliate_paid(uuid,uuid) to anon;

-- ── 9. المدير: تبديل النسبة (تطبّق على الدفعات الجاية برك) ──────
create or replace function api_admin_set_rate(p_token uuid, p_rate numeric)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  if p_rate is null or p_rate < 0 or p_rate > 100 then raise exception 'bad_rate'; end if;
  update affiliate_config set rate = p_rate where id = 1;
end $$;
grant execute on function api_admin_set_rate(uuid,numeric) to anon;

-- ── 10. إعادة تعيين كلمة السر (كانت في 03) ────────────────────
create or replace function api_admin_set_password(p_token uuid, p_agency uuid, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'weak_password'; end if;
  update agencies set pw_hash = crypt(p_password, gen_salt('bf', 10)) where id = p_agency;
  delete from sessions where agency_id = p_agency;
end $$;
grant execute on function api_admin_set_password(uuid,uuid,text) to anon;

notify pgrst, 'reload schema';
