-- ═══════════════════════════════════════════════════════════════
--  Khedmti — حماية السيرفر للحسابات المنتهية والموقوفة
--  SQL Editor → الصق كامل → Run
-- ═══════════════════════════════════════════════════════════════
--  حساب موقوف من الأدمين  → لا قراءة لا حفظ.
--  تجربة/اشتراك انتهى      → يقرا بياناتو برك، وما يقدر يزيد
--                            ولا يبدّل حتى حاجة حتى يجدّد.
--  الشات تاع الدعم يبقى يخدم في الحالتين.
-- ═══════════════════════════════════════════════════════════════

-- مفتوح للقراءة: أي حساب ماهوش موقوف
create or replace function account_open(p_agency uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(a.is_super, false) or coalesce(a.is_active, true)
    from agencies a where a.id = p_agency;
$$;

-- مفتوح للكتابة: ماهوش موقوف، وخطتو مازال ما فاتش تاريخها
create or replace function account_writable(p_agency uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(a.is_super, false)
      or (coalesce(a.is_active, true)
          and not (a.plan <> 'free' and a.plan_expires_at is not null and a.plan_expires_at < now()))
    from agencies a where a.id = p_agency;
$$;

create or replace function api_load(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ag uuid; d jsonb;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  if not account_open(ag) then raise exception 'account_blocked'; end if;
  select data into d from app_data where agency_id = ag;
  return coalesce(d, '{"editors":[],"clients":[],"videos":[],"invoices":[],"tasks":[]}'::jsonb);
end $$;

create or replace function api_save(p_token uuid, p_data jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare ag uuid;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  if not account_open(ag) then raise exception 'account_blocked'; end if;
  if not account_writable(ag) then raise exception 'account_readonly'; end if;
  insert into app_data (agency_id, data, updated_at) values (ag, p_data, now())
  on conflict (agency_id) do update set data = excluded.data, updated_at = now();
end $$;

grant execute on function api_load(uuid)       to anon;
grant execute on function api_save(uuid,jsonb) to anon;

notify pgrst, 'reload schema';
