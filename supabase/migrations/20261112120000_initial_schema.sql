-- Initial schema: profiles, dashboard preferences, currency watchlist, assets,
-- CVE watchlist, news bookmarks, CV builder, storage buckets.
-- Every table holding personal data is owned by auth.users via user_id and
-- protected by Row Level Security so only the owner can read or write it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.asset_category as enum (
  'electronics', 'vehicle', 'property', 'furniture', 'software', 'other'
);

create type public.asset_status as enum (
  'active', 'inactive', 'disposed', 'sold', 'lost'
);

create type public.employment_type as enum (
  'full_time', 'part_time', 'contract', 'freelance', 'internship', 'self_employed'
);

create type public.skill_level as enum (
  'beginner', 'intermediate', 'advanced', 'expert'
);

create type public.cv_template as enum (
  'modern_minimalist', 'ats_friendly', 'developer_portfolio'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  professional_title text,
  avatar_url text,
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- dashboard_preferences
-- ---------------------------------------------------------------------------

create table public.dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  widget_order text[] not null default array['welcome','currency','assets','cve','news','quick_access'],
  hidden_widgets text[] not null default array[]::text[],
  quick_links text[] not null default array['/currency','/assets','/cve','/news','/cv','/settings'],
  default_currency_base text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- currency_watchlists
-- ---------------------------------------------------------------------------

create table public.currency_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint currency_watchlists_distinct check (base_currency <> quote_currency),
  constraint currency_watchlists_unique unique (user_id, base_currency, quote_currency)
);

create index currency_watchlists_user_idx on public.currency_watchlists (user_id, position);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  category public.asset_category not null default 'other',
  description text,
  purchase_date date not null,
  purchase_price numeric(18, 2) not null check (purchase_price >= 0),
  status public.asset_status not null default 'active',
  notes text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_user_idx on public.assets (user_id, created_at desc);
create index assets_category_idx on public.assets (user_id, category);

-- ---------------------------------------------------------------------------
-- cve_bookmarks / cve_notes
-- ---------------------------------------------------------------------------

create table public.cve_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cve_id text not null check (cve_id ~ '^CVE-\d{4}-\d{4,}$'),
  -- Snapshot fields so the watchlist renders without re-querying NVD.
  description text,
  severity text,
  cvss_score numeric(3, 1),
  published_at timestamptz,
  is_reviewed boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cve_bookmarks_unique unique (user_id, cve_id)
);

create index cve_bookmarks_user_idx on public.cve_bookmarks (user_id, created_at desc);

create table public.cve_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bookmark_id uuid not null references public.cve_bookmarks (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cve_notes_bookmark_idx on public.cve_notes (bookmark_id, created_at desc);

-- ---------------------------------------------------------------------------
-- news_bookmarks (saved articles + read-later state)
-- ---------------------------------------------------------------------------

create table public.news_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_url text not null,
  title text not null,
  description text,
  source text not null,
  category text not null,
  image_url text,
  published_at timestamptz,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_bookmarks_unique unique (user_id, article_url)
);

create index news_bookmarks_user_idx on public.news_bookmarks (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- CV builder
-- cv_profiles is one row per CV version (template, layout, personal info).
-- Experience/education/skills/projects/certifications are the user's master
-- data, shared by every CV version.
-- ---------------------------------------------------------------------------

create table public.cv_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version_name text not null default 'Main CV',
  template public.cv_template not null default 'modern_minimalist',
  is_default boolean not null default false,
  full_name text not null default '',
  professional_title text,
  photo_path text,
  email text,
  phone text,
  location text,
  website text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  summary text,
  section_order text[] not null default array['summary','experience','education','skills','projects','certifications'],
  hidden_sections text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cv_profiles_user_idx on public.cv_profiles (user_id, created_at);
create unique index cv_profiles_one_default on public.cv_profiles (user_id) where is_default;

create table public.cv_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null,
  position text not null,
  employment_type public.employment_type not null default 'full_time',
  location text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text,
  responsibilities text[] not null default array[]::text[],
  achievements text[] not null default array[]::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cv_experiences_dates check (end_date is null or end_date >= start_date)
);

create table public.cv_educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  institution text not null,
  degree text not null,
  major text,
  start_year integer not null check (start_year between 1900 and 2200),
  graduation_year integer check (graduation_year between 1900 and 2200),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cv_educations_years check (graduation_year is null or graduation_year >= start_year)
);

create table public.cv_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'General',
  level public.skill_level not null default 'intermediate',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cv_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text,
  technologies text[] not null default array[]::text[],
  project_url text,
  github_url text,
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cv_projects_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.cv_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  issuer text not null,
  issue_date date,
  credential_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cv_experiences_user_idx on public.cv_experiences (user_id, start_date desc);
create index cv_educations_user_idx on public.cv_educations (user_id, start_year desc);
create index cv_skills_user_idx on public.cv_skills (user_id, sort_order);
create index cv_projects_user_idx on public.cv_projects (user_id, start_date desc);
create index cv_certifications_user_idx on public.cv_certifications (user_id, issue_date desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers + owner-only RLS for every table
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'dashboard_preferences', 'currency_watchlists', 'assets',
    'cve_bookmarks', 'cve_notes', 'news_bookmarks',
    'cv_profiles', 'cv_experiences', 'cv_educations', 'cv_skills', 'cv_projects',
    'cv_certifications'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- profiles is keyed by the auth user id itself.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'dashboard_preferences', 'currency_watchlists', 'assets',
    'cve_bookmarks', 'cve_notes', 'news_bookmarks',
    'cv_profiles', 'cv_experiences', 'cv_educations', 'cv_skills', 'cv_projects',
    'cv_certifications'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t
    );
  end loop;
end;
$$;

-- A CVE note must point at a bookmark the same user owns.
create or replace function public.ensure_same_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_owner uuid;
begin
  if tg_table_name = 'cve_notes' then
    select user_id into parent_owner from public.cve_bookmarks where id = new.bookmark_id;
  end if;

  if parent_owner is null or parent_owner <> new.user_id then
    raise exception 'Parent record does not belong to this user';
  end if;
  return new;
end;
$$;

create trigger cve_notes_owner
  before insert or update on public.cve_notes
  for each row execute function public.ensure_same_owner();

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + dashboard preferences + default CV version
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));

  insert into public.dashboard_preferences (user_id) values (new.id);

  insert into public.cv_profiles (user_id, version_name, is_default, full_name, email)
  values (
    new.id, 'Main CV', true,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );

  insert into public.currency_watchlists (user_id, base_currency, quote_currency, position)
  values
    (new.id, 'USD', 'IDR', 0),
    (new.id, 'EUR', 'IDR', 1),
    (new.id, 'SGD', 'IDR', 2);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Single-owner guard. auth.users accepts only the owner address, holds at
-- most one account, and the owner's email cannot be changed to another
-- address, even if public sign-up is re-enabled in the Supabase dashboard.
-- Keep the address in sync with src/config/owner.ts.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_single_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) <> 'nurhilmi.mail@gmail.com' then
    raise exception 'Only the owner account is allowed';
  end if;
  if tg_op = 'INSERT' and exists (select 1 from auth.users) then
    raise exception 'Only one account is allowed';
  end if;
  return new;
end;
$$;

create trigger enforce_single_user
  before insert or update of email on auth.users
  for each row execute function public.enforce_single_user();

-- ---------------------------------------------------------------------------
-- Storage: private buckets, files stored under "<user_id>/..."
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('asset-images', 'asset-images', false, 5242880, array['image/png','image/jpeg','image/webp','image/gif']),
  ('cv-photos', 'cv-photos', false, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "storage_select_own" on storage.objects
  for select to authenticated
  using (bucket_id in ('asset-images', 'cv-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('asset-images', 'cv-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_update_own" on storage.objects
  for update to authenticated
  using (bucket_id in ('asset-images', 'cv-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id in ('asset-images', 'cv-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);
