-- ═══════════════════════════════════════════════════════════════
--  Khedmti — دردشة الدعم
--  SQL Editor → الصق هذا كامل → Run
-- ═══════════════════════════════════════════════════════════════
--  محادثة واحدة لكل حساب، بينو وبين المدير العام.
--  نفس النمط: الجدول مقفول، والوصول عبر دوال فقط.
-- ═══════════════════════════════════════════════════════════════

create table if not exists support_messages (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references agencies(id) on delete cascade,
  from_admin boolean not null default false,
  body       text not null,
  seen       boolean not null default false,   -- شافها الطرف الآخر
  created_at timestamptz not null default now()
);

create index if not exists support_agency_idx on support_messages(agency_id, created_at);

alter table support_messages enable row level security;
drop policy if exists "allow all" on support_messages;

-- ── المستعمل ──────────────────────────────────────────────────
create or replace function api_support_send(p_token uuid, p_body text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ag uuid; m support_messages;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  if length(trim(coalesce(p_body,''))) = 0 then raise exception 'empty_message'; end if;
  insert into support_messages (agency_id, from_admin, body)
  values (ag, false, left(trim(p_body), 4000))
  returning * into m;
  return to_jsonb(m);
end $$;

create or replace function api_support_list(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare ag uuid; r jsonb;
begin
  ag := session_agency(p_token);
  if ag is null then raise exception 'no_session'; end if;
  -- فتح المحادثة = قرا ردود المدير
  update support_messages set seen = true
   where agency_id = ag and from_admin = true and seen = false;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]'::jsonb)
    into r from support_messages m where m.agency_id = ag;
  return r;
end $$;

-- عدّاد خفيف للشارة — ما يجيبش المحادثة كاملة
create or replace function api_support_unread(p_token uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare ag uuid; n int;
begin
  ag := session_agency(p_token);
  if ag is null then return 0; end if;
  select count(*) into n from support_messages
   where agency_id = ag and from_admin = true and seen = false;
  return coalesce(n, 0);
end $$;

-- ── المدير العام ──────────────────────────────────────────────
create or replace function api_admin_support_threads(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(x order by x.last_at desc), '[]'::jsonb) into r
  from (
    select a.id         as agency_id,
           a.name       as agency_name,
           a.email      as agency_email,
           max(m.created_at) as last_at,
           (array_agg(m.body order by m.created_at desc))[1] as last_body,
           count(*) filter (where m.from_admin = false and m.seen = false) as unread
      from support_messages m
      join agencies a on a.id = m.agency_id
     group by a.id, a.name, a.email
  ) x;
  return r;
end $$;

create or replace function api_admin_support_list(p_token uuid, p_agency uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  update support_messages set seen = true
   where agency_id = p_agency and from_admin = false and seen = false;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]'::jsonb)
    into r from support_messages m where m.agency_id = p_agency;
  return r;
end $$;

create or replace function api_admin_support_send(p_token uuid, p_agency uuid, p_body text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare m support_messages;
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_body,''))) = 0 then raise exception 'empty_message'; end if;
  insert into support_messages (agency_id, from_admin, body)
  values (p_agency, true, left(trim(p_body), 4000))
  returning * into m;
  return to_jsonb(m);
end $$;

-- ── الصلاحيات ─────────────────────────────────────────────────
grant execute on function api_support_send(uuid,text)              to anon;
grant execute on function api_support_list(uuid)                   to anon;
grant execute on function api_support_unread(uuid)                 to anon;
grant execute on function api_admin_support_threads(uuid)          to anon;
grant execute on function api_admin_support_list(uuid,uuid)        to anon;
grant execute on function api_admin_support_send(uuid,uuid,text)   to anon;
