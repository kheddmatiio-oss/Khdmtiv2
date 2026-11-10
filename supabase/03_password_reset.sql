-- ═══════════════════════════════════════════════════════════════
--  Khedmti — إعادة تعيين كلمة السر من طرف المدير
--  SQL Editor → الصق → Run
-- ═══════════════════════════════════════════════════════════════
--  حل مؤقت حتى يجي رابط الإيميل: المدير العام يعيّن كلمة سر جديدة
--  للحساب. ما يقدرش يقرا القديمة — bcrypt ما ينعكسش — غير يبدّلها.
-- ═══════════════════════════════════════════════════════════════

create or replace function api_admin_set_password(
  p_token uuid, p_agency uuid, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_super_session(p_token) then raise exception 'forbidden'; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'weak_password'; end if;

  update agencies
     set pw_hash = crypt(p_password, gen_salt('bf', 10))
   where id = p_agency;

  -- كل جلسات الحساب تتقطع، باش كلمة السر القديمة ما تبقاش تخدم
  delete from sessions where agency_id = p_agency;
end $$;

grant execute on function api_admin_set_password(uuid,uuid,text) to anon;
