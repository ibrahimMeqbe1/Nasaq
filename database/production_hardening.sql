-- NASAQ production hardening · 2026-08-16
-- Idempotent migration for the live Supabase project.

begin;

-- Persist every field that exists in the detailed nominations workflow.
alter table public.nominations add column if not exists serial_no integer default 0;
alter table public.nominations add column if not exists gender text default 'ذكر';
alter table public.nominations add column if not exists phone_alt text;
alter table public.nominations add column if not exists wife_2_name text;
alter table public.nominations add column if not exists wife_2_id text;
alter table public.nominations add column if not exists age_0_2_male integer default 0;
alter table public.nominations add column if not exists age_0_2_female integer default 0;
alter table public.nominations add column if not exists age_3_5_male integer default 0;
alter table public.nominations add column if not exists age_3_5_female integer default 0;
alter table public.nominations add column if not exists age_6_18_male integer default 0;
alter table public.nominations add column if not exists age_6_18_female integer default 0;
alter table public.nominations add column if not exists age_19_60_male integer default 0;
alter table public.nominations add column if not exists age_19_60_female integer default 0;
alter table public.nominations add column if not exists age_over_60_male integer default 0;
alter table public.nominations add column if not exists age_over_60_female integer default 0;
alter table public.nominations add column if not exists current_address text;
alter table public.nominations add column if not exists original_address text;
alter table public.nominations add column if not exists governorate text default 'شمال غزة';
alter table public.nominations add column if not exists camp_name text;
alter table public.nominations add column if not exists shelter_manager text;
alter table public.nominations add column if not exists shelter_phone text;
alter table public.nominations add column if not exists shelter_phone_alt text;
alter table public.nominations add column if not exists shelter_address text;
alter table public.nominations add column if not exists shelter_gps text;

-- Align renewal requests with the application contract without losing legacy fields.
alter table public.renewal_requests add column if not exists requested_months integer default 1;
alter table public.renewal_requests add column if not exists request_date timestamptz default now();
update public.renewal_requests
set request_date = coalesce(request_date, created_at, now()),
    requested_months = greatest(coalesce(requested_months, 1), 1);

-- Consolidate legacy camp column pairs while keeping backward compatibility.
update public.camps
set phone = coalesce(nullif(phone, ''), manager_phone),
    manager_phone = coalesce(nullif(manager_phone, ''), phone),
    location = coalesce(nullif(location, ''), address),
    address = coalesce(nullif(address, ''), location);

-- Supabase Auth is the only credential store. Public profile rows contain no hashes.
alter table public.users drop column if exists password;
alter table public.users alter column camp_id drop not null;
update public.users set camp_id = null where role = 'superadmin';

-- Durable operational settings shared by every administrator session.
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Referential integrity makes camp deletion complete and deterministic.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'families_camp_id_fkey') then
    alter table public.families
      add constraint families_camp_id_fkey foreign key (camp_id) references public.camps(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nominations_camp_id_fkey') then
    alter table public.nominations
      add constraint nominations_camp_id_fkey foreign key (camp_id) references public.camps(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'renewal_requests_camp_id_fkey') then
    alter table public.renewal_requests
      add constraint renewal_requests_camp_id_fkey foreign key (camp_id) references public.camps(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_camp_id_fkey') then
    alter table public.users
      add constraint users_camp_id_fkey foreign key (camp_id) references public.camps(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_role_check') then
    alter table public.users
      add constraint users_role_check check (role in ('admin', 'superadmin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'families_members_count_check') then
    alter table public.families
      add constraint families_members_count_check check (members_count is null or members_count >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nominations_members_count_check') then
    alter table public.nominations
      add constraint nominations_members_count_check check (members_count is null or members_count >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'renewal_requested_months_check') then
    alter table public.renewal_requests
      add constraint renewal_requested_months_check check (requested_months >= 1);
  end if;
end $$;

create index if not exists families_camp_created_idx on public.families(camp_id, created_at);
create index if not exists nominations_camp_created_idx on public.nominations(camp_id, created_at);
create index if not exists renewal_requests_camp_status_idx on public.renewal_requests(camp_id, status);
create index if not exists users_camp_role_idx on public.users(camp_id, role);
create unique index if not exists users_username_lower_key on public.users(lower(username));
create unique index if not exists families_camp_id_number_key
  on public.families(camp_id, id_number) where nullif(trim(id_number), '') is not null;
create unique index if not exists nominations_camp_id_number_key
  on public.nominations(camp_id, id_number) where nullif(trim(id_number), '') is not null;

alter table public.system_settings enable row level security;
drop policy if exists system_settings_read_authenticated on public.system_settings;
drop policy if exists system_settings_write_superadmin on public.system_settings;
drop policy if exists system_settings_insert_superadmin on public.system_settings;
drop policy if exists system_settings_update_superadmin on public.system_settings;
drop policy if exists system_settings_delete_superadmin on public.system_settings;
create policy system_settings_read_authenticated on public.system_settings
  for select to authenticated using (true);
create policy system_settings_insert_superadmin on public.system_settings
  for insert to authenticated with check (private.is_superadmin());
create policy system_settings_update_superadmin on public.system_settings
  for update to authenticated using (private.is_superadmin()) with check (private.is_superadmin());
create policy system_settings_delete_superadmin on public.system_settings
  for delete to authenticated using (private.is_superadmin());

revoke all on public.system_settings from public, anon;
grant select, insert, update, delete on public.system_settings to authenticated;

-- Atomic database half of camp creation. Supabase Auth creation is compensated
-- by the API route if this transaction fails.
create or replace function public.create_camp_profile(
  target_camp_id text,
  target_name text,
  target_manager_name text,
  target_phone text,
  target_expiry timestamptz,
  target_user_id text,
  target_username text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  insert into public.camps (
    id, name, manager_name, manager_phone, phone, is_active, subscription_expiry
  ) values (
    target_camp_id, target_name, target_manager_name, target_phone, target_phone, true, target_expiry
  );

  insert into public.users (id, username, role, camp_id, name)
  values (target_user_id, target_username, 'admin', target_camp_id, target_name);

  return jsonb_build_object('camp_id', target_camp_id, 'user_id', target_user_id);
end;
$$;

-- Complete database deletion in one transaction. ON DELETE CASCADE removes all
-- camp-owned profiles, families, nominations, and renewal requests.
create or replace function public.delete_camp_data(target_camp_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  family_count bigint;
  nomination_count bigint;
  request_count bigint;
  profile_count bigint;
  deleted_camp_count bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if target_camp_id is null or target_camp_id = '' then
    raise exception 'camp id required' using errcode = '22023';
  end if;

  select count(*) into family_count from public.families where camp_id = target_camp_id;
  select count(*) into nomination_count from public.nominations where camp_id = target_camp_id;
  select count(*) into request_count from public.renewal_requests where camp_id = target_camp_id;
  select count(*) into profile_count from public.users where camp_id = target_camp_id;

  delete from public.camps where id = target_camp_id;
  get diagnostics deleted_camp_count = row_count;
  if deleted_camp_count <> 1 then
    raise exception 'camp not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'families', family_count,
    'nominations', nomination_count,
    'renewalRequests', request_count,
    'users', profile_count
  );
end;
$$;

-- Approve request and extend subscription atomically.
create or replace function public.approve_renewal_request(
  target_request_id text,
  target_camp_id text,
  months_to_add integer default 1
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed bigint;
begin
  if not private.is_superadmin() then
    raise exception 'superadmin required' using errcode = '42501';
  end if;

  update public.renewal_requests
  set status = 'approved'
  where id = target_request_id and camp_id = target_camp_id;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'renewal request not found' using errcode = 'P0002';
  end if;

  update public.camps
  set subscription_expiry = greatest(coalesce(subscription_expiry, now()), now())
      + make_interval(months => greatest(coalesce(months_to_add, 1), 1)),
      is_active = true
  where id = target_camp_id;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'camp not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.create_camp_profile(text, text, text, text, timestamptz, text, text)
  from public, anon, authenticated;
revoke all on function public.delete_camp_data(text) from public, anon, authenticated;
revoke all on function public.approve_renewal_request(text, text, integer) from public, anon;
grant execute on function public.create_camp_profile(text, text, text, text, timestamptz, text, text)
  to service_role;
grant execute on function public.delete_camp_data(text) to service_role;
grant execute on function public.approve_renewal_request(text, text, integer) to authenticated;

-- Keep Realtime scoped to the three operational tables used by the UI.
drop publication if exists supabase_realtime;
create publication supabase_realtime for table
  public.families,
  public.nominations,
  public.announcements;

commit;
