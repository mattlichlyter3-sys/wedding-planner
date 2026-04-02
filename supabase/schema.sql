-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type suggestion_category as enum (
  'food', 'music', 'decor', 'venue', 'activity', 'other'
);

create type audit_action as enum (
  'INSERT', 'UPDATE', 'DELETE'
);

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  is_admin    boolean not null default false,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  color       text not null default '#6b7280',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BUDGET ITEMS
-- ============================================================
create table budget_items (
  id              uuid primary key default uuid_generate_v4(),
  category_id     uuid not null references categories(id) on delete restrict,
  vendor_name     text not null,
  vendor_contact  text,
  estimated_cost  numeric(10,2) not null default 0,
  actual_cost     numeric(10,2),
  deposit_paid    numeric(10,2) not null default 0,
  balance_due     numeric(10,2) generated always as (
                    coalesce(actual_cost, estimated_cost) - deposit_paid
                  ) stored,
  confirmed       boolean not null default false,
  notes           text,
  created_by      uuid not null references profiles(id),
  updated_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index budget_items_category_idx on budget_items(category_id);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
create table calendar_events (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  event_date      date not null,
  event_time      time,
  description     text,
  budget_item_id  uuid references budget_items(id) on delete set null,
  created_by      uuid not null references profiles(id),
  updated_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index calendar_events_date_idx on calendar_events(event_date);

-- ============================================================
-- MENU PROVIDERS
-- ============================================================
create table menu_providers (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  website         text,
  notes           text,
  is_selected     boolean not null default false,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table menu_items (
  id              uuid primary key default uuid_generate_v4(),
  provider_id     uuid not null references menu_providers(id) on delete cascade,
  item_name       text not null,
  description     text,
  cost_per_person numeric(10,2),
  flat_cost       numeric(10,2),
  quantity        integer not null default 1,
  total_cost      numeric(10,2) generated always as (
                    case
                      when cost_per_person is not null
                        then cost_per_person * quantity
                      else flat_cost
                    end
                  ) stored,
  sort_order      integer not null default 0,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index menu_items_provider_idx on menu_items(provider_id);

-- ============================================================
-- SUGGESTIONS
-- ============================================================
create table suggestions (
  id              uuid primary key default uuid_generate_v4(),
  submitter_name  text not null,
  suggestion_text text not null,
  category        suggestion_category not null default 'other',
  is_reviewed     boolean not null default false,
  admin_notes     text,
  submitted_at    timestamptz not null default now()
);

create index suggestions_reviewed_idx on suggestions(is_reviewed);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_log (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id) on delete set null,
  user_email    text,
  table_name    text not null,
  record_id     uuid not null,
  action        audit_action not null,
  old_values    jsonb,
  new_values    jsonb,
  changed_at    timestamptz not null default now()
);

create index audit_log_table_record_idx on audit_log(table_name, record_id);
create index audit_log_user_idx on audit_log(user_id);
create index audit_log_changed_at_idx on audit_log(changed_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create trigger set_budget_items_updated_at
  before update on budget_items
  for each row execute procedure set_updated_at();

create trigger set_calendar_events_updated_at
  before update on calendar_events
  for each row execute procedure set_updated_at();

create trigger set_menu_providers_updated_at
  before update on menu_providers
  for each row execute procedure set_updated_at();

create trigger set_menu_items_updated_at
  before update on menu_items
  for each row execute procedure set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY HELPER
-- ============================================================
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- ---- profiles ----
alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin can update any profile"
  on profiles for update to authenticated
  using (is_admin());

-- ---- categories ----
alter table categories enable row level security;

create policy "Authenticated users can view categories"
  on categories for select to authenticated using (true);

create policy "Admin can manage categories"
  on categories for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---- budget_items ----
alter table budget_items enable row level security;

create policy "Authenticated users can view budget items"
  on budget_items for select to authenticated using (true);

create policy "Authenticated users can create budget items"
  on budget_items for insert to authenticated
  with check (created_by = auth.uid());

create policy "Creator or admin can update budget items"
  on budget_items for update to authenticated
  using (created_by = auth.uid() or is_admin());

create policy "Admin can delete budget items"
  on budget_items for delete to authenticated
  using (is_admin());

-- ---- calendar_events ----
alter table calendar_events enable row level security;

create policy "Authenticated users can view events"
  on calendar_events for select to authenticated using (true);

create policy "Authenticated users can create events"
  on calendar_events for insert to authenticated
  with check (created_by = auth.uid());

create policy "Creator or admin can update events"
  on calendar_events for update to authenticated
  using (created_by = auth.uid() or is_admin());

create policy "Admin can delete events"
  on calendar_events for delete to authenticated
  using (is_admin());

-- ---- menu_providers ----
alter table menu_providers enable row level security;

create policy "Authenticated users can view providers"
  on menu_providers for select to authenticated using (true);

create policy "Authenticated users can create providers"
  on menu_providers for insert to authenticated
  with check (created_by = auth.uid());

create policy "Creator or admin can update providers"
  on menu_providers for update to authenticated
  using (created_by = auth.uid() or is_admin());

create policy "Admin can delete providers"
  on menu_providers for delete to authenticated
  using (is_admin());

-- ---- menu_items ----
alter table menu_items enable row level security;

create policy "Authenticated users can view menu items"
  on menu_items for select to authenticated using (true);

create policy "Authenticated users can insert menu items"
  on menu_items for insert to authenticated
  with check (created_by = auth.uid());

create policy "Creator or admin can update menu items"
  on menu_items for update to authenticated
  using (created_by = auth.uid() or is_admin());

create policy "Admin can delete menu items"
  on menu_items for delete to authenticated
  using (is_admin());

-- ---- suggestions ----
alter table suggestions enable row level security;

create policy "Anyone can submit a suggestion"
  on suggestions for insert to anon, authenticated
  with check (true);

create policy "Authenticated users can view suggestions"
  on suggestions for select to authenticated using (true);

create policy "Admin can update suggestions"
  on suggestions for update to authenticated
  using (is_admin());

create policy "Admin can delete suggestions"
  on suggestions for delete to authenticated
  using (is_admin());

-- ---- audit_log ----
alter table audit_log enable row level security;

create policy "Admin can view audit log"
  on audit_log for select to authenticated
  using (is_admin());

create policy "Service role can insert audit log"
  on audit_log for insert to service_role
  with check (true);

-- ============================================================
-- SEED DATA
-- ============================================================
insert into categories (name, color, sort_order) values
  ('Venue',        '#8b5cf6', 1),
  ('Food',         '#f59e0b', 2),
  ('DJ',           '#3b82f6', 3),
  ('Photography',  '#ec4899', 4),
  ('Florals',      '#10b981', 5),
  ('Rentals',      '#6b7280', 6),
  ('Other',        '#94a3b8', 7);
