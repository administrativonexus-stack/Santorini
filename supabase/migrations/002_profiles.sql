create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  full_name    text not null,
  phone        text,
  avatar_url   text,
  role         user_role not null default 'client',
  created_at   timestamptz default now()
);

-- Auto-create profile row when a new auth user signs up
-- SET search_path = public required for SECURITY DEFINER to resolve public.profiles
create or replace function handle_new_user()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
