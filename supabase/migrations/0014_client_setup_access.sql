begin;

-- Setup credentials are never part of publicly readable store rows.
create table if not exists public.store_setup_access (
  store_id uuid primary key references public.stores(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  password text not null,
  created_at timestamptz not null default now()
);
alter table public.store_setup_access enable row level security;
revoke all on public.store_setup_access from anon, authenticated;
grant all on public.store_setup_access to service_role;

-- Store members can configure their business details and subdomain, not platform status/access.
create or replace function public.protect_store_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_master_owner() then
    new.status := old.status;
    new.client_credentials := old.client_credentials;
    new.delivered_at := old.delivered_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Enforce attribution even for direct PostgREST requests with a client's session.
create or replace function public.protect_store_attribution()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_master_owner() then
    if TG_OP = 'INSERT' then
      new.developer_url := 'https://maaoun.com';
    else
      new.developer_url := old.developer_url;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_store_attribution on public.store_settings;
create trigger protect_store_attribution before insert or update on public.store_settings
for each row execute function public.protect_store_attribution();

-- Retain historical data without exposing or writing the retired feature.
revoke all on public.activity_logs from anon, authenticated;
drop policy if exists logs_select on public.activity_logs;
drop policy if exists logs_insert on public.activity_logs;
commit;
