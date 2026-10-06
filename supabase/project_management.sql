-- Project management schema for Supabase.
-- Run this in the Supabase SQL editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  company text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  code text not null unique,
  description text,
  status text not null default 'active' check (status in ('planning', 'active', 'paused', 'completed', 'archived')),
  start_date date,
  due_date date,
  budget numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_states (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'slate',
  sort_order integer not null default 0,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  state_id uuid not null references public.task_states(id) on delete restrict,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  estimate_minutes integer check (estimate_minutes is null or estimate_minutes > 0),
  due_date date,
  recurrence_interval integer check (recurrence_interval is null or recurrence_interval > 0),
  recurrence_unit text check (recurrence_unit is null or recurrence_unit in ('day', 'week', 'month')),
  recurrence_until date,
  recurrence_source_id uuid references public.tasks(id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_recurrence_unit_pair check ((recurrence_interval is null) = (recurrence_unit is null)),
  constraint tasks_recurrence_needs_due_date check (recurrence_interval is null or due_date is not null),
  constraint tasks_recurrence_end_needs_rule check (recurrence_until is null or recurrence_interval is not null),
  constraint tasks_recurrence_end_after_start check (recurrence_until is null or due_date is null or recurrence_until >= due_date)
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  action text not null check (action in ('created', 'started', 'stopped', 'state_changed', 'updated', 'commented')),
  started_at timestamptz,
  stopped_at timestamptz,
  duration_minutes integer generated always as (
    case
      when started_at is not null and stopped_at is not null
      then greatest(0, floor(extract(epoch from (stopped_at - started_at)) / 60)::integer)
      else null
    end
  ) stored,
  from_state_id uuid references public.task_states(id) on delete set null,
  to_state_id uuid references public.task_states(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- Many-to-many links, in addition to the primary project_id/client_id above.
-- The primary columns keep single-project/single-client views (board, overview) simple,
-- while these junction tables let a task span multiple projects and a project span multiple clients.
create table if not exists public.task_projects (
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, project_id)
);

create table if not exists public.project_clients (
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, client_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  weekly_capacity_minutes integer not null default 2400,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_weekly_capacity_positive check (weekly_capacity_minutes > 0)
);

create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  constraint task_dependencies_no_self_reference check (task_id <> depends_on_task_id)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  due_date date,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  template jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  task_id uuid references public.tasks(id) on delete cascade,
  kind text not null check (kind in ('mention', 'assignment', 'reminder', 'overdue')),
  title text not null,
  body text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, dedupe_key)
);

do $$
begin
  alter table public.notifications drop constraint if exists notifications_kind_check;
  alter table public.notifications
    add constraint notifications_kind_check
    check (kind in ('mention', 'assignment', 'reminder', 'overdue'));
end $$;

-- Adds the user_email column for installs where task_history already existed.
alter table public.task_history add column if not exists user_email text;
alter table public.profiles add column if not exists weekly_capacity_minutes integer not null default 2400;
alter table public.tasks add column if not exists recurrence_interval integer;
alter table public.tasks add column if not exists recurrence_unit text;
alter table public.tasks add column if not exists recurrence_until date;
alter table public.tasks add column if not exists recurrence_source_id uuid references public.tasks(id) on delete set null;
alter table public.notifications add column if not exists dedupe_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_unit_pair'
  ) then
    alter table public.tasks add constraint tasks_recurrence_unit_pair
      check ((recurrence_interval is null) = (recurrence_unit is null));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_needs_due_date'
  ) then
    alter table public.tasks add constraint tasks_recurrence_needs_due_date
      check (recurrence_interval is null or due_date is not null);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_end_after_start'
  ) then
    alter table public.tasks add constraint tasks_recurrence_end_after_start
      check (recurrence_until is null or due_date is null or recurrence_until >= due_date);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_recurrence_end_needs_rule'
  ) then
    alter table public.tasks add constraint tasks_recurrence_end_needs_rule
      check (recurrence_until is null or recurrence_interval is not null);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_weekly_capacity_positive'
  ) then
    alter table public.profiles add constraint profiles_weekly_capacity_positive
      check (weekly_capacity_minutes > 0);
  end if;
end $$;

-- Backfill the junction tables from existing primary relations.
insert into public.task_projects (task_id, project_id)
select id, project_id from public.tasks
on conflict (task_id, project_id) do nothing;

insert into public.project_clients (project_id, client_id)
select id, client_id from public.projects
on conflict (project_id, client_id) do nothing;

create index if not exists projects_client_id_idx on public.projects(client_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists task_history_task_id_idx on public.task_history(task_id, created_at desc);
create index if not exists task_history_created_at_idx on public.task_history(created_at desc);
create index if not exists projects_created_at_idx on public.projects(created_at desc);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
create index if not exists clients_created_at_idx on public.clients(created_at desc);
create index if not exists task_projects_project_id_idx on public.task_projects(project_id);
create index if not exists project_clients_client_id_idx on public.project_clients(client_id);
create index if not exists task_dependencies_depends_on_idx on public.task_dependencies(depends_on_task_id);
create index if not exists project_milestones_project_due_idx on public.project_milestones(project_id, due_date);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(recipient_id, created_at desc) where read_at is null;
create unique index if not exists tasks_recurrence_occurrence_idx
  on public.tasks(recurrence_source_id, due_date)
  where recurrence_source_id is not null and due_date is not null;

create or replace view public.workspace_activity
with (security_invoker = true)
as
select
  history.id::text as id,
  history.task_id,
  history.user_email,
  history.action,
  history.note,
  history.started_at,
  history.duration_minutes,
  history.created_at,
  'task'::text as entity_type,
  null::text as entity_title,
  null::text as entity_detail,
  null::uuid as project_id
from public.task_history as history
union all
select
  'project-created-' || project.id::text,
  null::uuid,
  null::text,
  'created'::text,
  null::text,
  null::timestamptz,
  null::integer,
  project.created_at,
  'project'::text,
  project.name,
  null::text,
  project.id
from public.projects as project
union all
select
  'project-updated-' || project.id::text,
  null::uuid,
  null::text,
  'updated'::text,
  null::text,
  null::timestamptz,
  null::integer,
  project.updated_at,
  'project'::text,
  project.name,
  null::text,
  project.id
from public.projects as project
where project.updated_at > project.created_at
union all
select
  'client-created-' || client.id::text,
  null::uuid,
  null::text,
  'created'::text,
  null::text,
  null::timestamptz,
  null::integer,
  client.created_at,
  'client'::text,
  client.name,
  client.company,
  null::uuid
from public.clients as client;

revoke all on table public.workspace_activity from anon, public;
grant select on table public.workspace_activity to authenticated;

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.task_states enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;
alter table public.task_projects enable row level security;
alter table public.project_clients enable row level security;
alter table public.profiles enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.project_milestones enable row level security;
alter table public.task_templates enable row level security;
alter table public.notifications enable row level security;

-- Lets the app's Supabase Realtime subscription pick up changes made outside
-- the app (other tabs/users, direct SQL) and invalidate its client-side cache.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'clients', 'projects', 'project_clients',
    'tasks', 'task_projects', 'task_states', 'task_history',
    'profiles', 'task_dependencies', 'project_milestones',
    'task_templates', 'notifications'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end $$;


drop policy if exists "authenticated users can read clients" on public.clients;
create policy "authenticated users can read clients" on public.clients for select to authenticated using (true);
drop policy if exists "authenticated users can create clients" on public.clients;
create policy "authenticated users can create clients" on public.clients for insert to authenticated with check (true);
drop policy if exists "authenticated users can read projects" on public.projects;
create policy "authenticated users can read projects" on public.projects for select to authenticated using (true);
drop policy if exists "authenticated users can create projects" on public.projects;
create policy "authenticated users can create projects" on public.projects for insert to authenticated with check (true);
drop policy if exists "authenticated users can read task states" on public.task_states;
create policy "authenticated users can read task states" on public.task_states for select to authenticated using (true);
drop policy if exists "users can read assigned tasks" on public.tasks;
create policy "users can read assigned tasks" on public.tasks for select to authenticated using (assigned_to = auth.uid() or assigned_to is null);
drop policy if exists "users can create tasks" on public.tasks;
create policy "users can create tasks" on public.tasks for insert to authenticated with check (assigned_to = auth.uid() or assigned_to is null);
drop policy if exists "users can update assigned tasks" on public.tasks;
create policy "users can update assigned tasks" on public.tasks for update to authenticated using (assigned_to = auth.uid() or assigned_to is null) with check (assigned_to = auth.uid() or assigned_to is null);
drop policy if exists "users can read task history" on public.task_history;
drop policy if exists "authenticated users can read task history" on public.task_history;
create policy "authenticated users can read task history" on public.task_history for select to authenticated using (true);
drop policy if exists "users can manage own task history" on public.task_history;
create policy "users can manage own task history" on public.task_history for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "authenticated users can read task projects" on public.task_projects;
create policy "authenticated users can read task projects" on public.task_projects for select to authenticated using (true);
drop policy if exists "authenticated users can manage task projects" on public.task_projects;
create policy "authenticated users can manage task projects" on public.task_projects for all to authenticated using (true) with check (true);
drop policy if exists "authenticated users can read project clients" on public.project_clients;
create policy "authenticated users can read project clients" on public.project_clients for select to authenticated using (true);
drop policy if exists "authenticated users can manage project clients" on public.project_clients;
create policy "authenticated users can manage project clients" on public.project_clients for all to authenticated using (true) with check (true);
drop policy if exists "users can update own task history" on public.task_history;
create policy "users can update own task history" on public.task_history for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "authenticated users can read all tasks" on public.tasks;
create policy "authenticated users can read all tasks" on public.tasks for select to authenticated using (true);
drop policy if exists "authenticated users can create tasks" on public.tasks;
create policy "authenticated users can create tasks" on public.tasks for insert to authenticated with check (true);
drop policy if exists "authenticated users can update tasks" on public.tasks;
create policy "authenticated users can update tasks" on public.tasks for update to authenticated using (true) with check (true);

revoke all on table public.profiles, public.task_dependencies,
  public.project_milestones, public.task_templates, public.notifications
  from anon, public;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, delete on table public.task_dependencies to authenticated;
grant select, insert, update, delete on table public.project_milestones to authenticated;
grant select, insert, update, delete on table public.task_templates to authenticated;
grant select, update on table public.notifications to authenticated;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "authenticated users can read task dependencies" on public.task_dependencies;
create policy "authenticated users can read task dependencies" on public.task_dependencies for select to authenticated using (true);
drop policy if exists "users can create task dependencies" on public.task_dependencies;
create policy "users can create task dependencies" on public.task_dependencies for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "users can remove task dependencies" on public.task_dependencies;
drop policy if exists "authenticated users can remove task dependencies" on public.task_dependencies;
create policy "authenticated users can remove task dependencies" on public.task_dependencies for delete to authenticated using (true);

drop policy if exists "authenticated users can read milestones" on public.project_milestones;
create policy "authenticated users can read milestones" on public.project_milestones for select to authenticated using (true);
drop policy if exists "authenticated users can manage milestones" on public.project_milestones;
create policy "authenticated users can manage milestones" on public.project_milestones for all to authenticated using (true) with check (created_by = (select auth.uid()));

drop policy if exists "authenticated users can read task templates" on public.task_templates;
create policy "authenticated users can read task templates" on public.task_templates for select to authenticated using (true);
drop policy if exists "users can create task templates" on public.task_templates;
create policy "users can create task templates" on public.task_templates for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "users can update own task templates" on public.task_templates;
create policy "users can update own task templates" on public.task_templates for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
drop policy if exists "users can delete own task templates" on public.task_templates;
create policy "users can delete own task templates" on public.task_templates for delete to authenticated using (created_by = (select auth.uid()));

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications" on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
drop policy if exists "users can mark own notifications read" on public.notifications;
create policy "users can mark own notifications read" on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
drop policy if exists "users can create own reminder notifications" on public.notifications;
create policy "users can create own reminder notifications" on public.notifications for insert to authenticated with check (
  recipient_id = (select auth.uid())
  and actor_id = (select auth.uid())
  and kind in ('reminder', 'overdue')
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_name text;
begin
  base_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-z0-9_.-]', '', 'g'))
      || '-' || left(new.id::text, 8),
    base_name
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

insert into public.profiles (id, username, display_name)
select
  users.id,
  lower(regexp_replace(split_part(coalesce(users.email, 'user'), '@', 1), '[^a-z0-9_.-]', '', 'g'))
    || '-' || left(users.id::text, 8),
  coalesce(
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(users.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(users.email, 'user'), '@', 1)
  )
from auth.users as users
on conflict (id) do nothing;

create or replace function public.notify_task_comment_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mention record;
begin
  if new.action <> 'commented' or new.note is null then
    return new;
  end if;

  for mention in
    select distinct profile.id
    from public.profiles as profile
    cross join lateral regexp_matches(
      new.note,
      '@([[:alnum:]_.-]+)',
      'gi'
    ) as matches(captured)
    where lower(profile.username) = lower(matches.captured[1])
      and profile.id <> new.user_id
  loop
    insert into public.notifications (
      recipient_id, actor_id, task_id, kind, title, body
    )
    values (
      mention.id,
      new.user_id,
      new.task_id,
      'mention',
      'You were mentioned in a task comment',
      left(new.note, 240)
    );
  end loop;
  return new;
end;
$$;

revoke execute on function public.notify_task_comment_mentions() from public, anon, authenticated;
drop trigger if exists on_task_comment_notify_mentions on public.task_history;
create trigger on_task_comment_notify_mentions
after insert on public.task_history
for each row execute procedure public.notify_task_comment_mentions();

create or replace function public.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is null
     or new.assigned_to = (select auth.uid()) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.assigned_to is not distinct from new.assigned_to then
      return new;
    end if;
  end if;

  insert into public.notifications (
    recipient_id, actor_id, task_id, kind, title, body
  )
  values (
    new.assigned_to,
    (select auth.uid()),
    new.id,
    'assignment',
    'A task was assigned to you',
    new.title
  );
  return new;
end;
$$;

revoke execute on function public.notify_task_assignment() from public, anon, authenticated;
drop trigger if exists on_task_assignment_notify_assignee on public.tasks;
create trigger on_task_assignment_notify_assignee
after insert or update of assigned_to on public.tasks
for each row execute procedure public.notify_task_assignment();

create or replace function public.spawn_next_recurring_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_due_date date;
  next_state_id uuid;
  series_id uuid;
  next_task_id uuid;
begin
  if not exists (
    select 1 from public.task_states
    where id = new.state_id and is_completed
  ) or exists (
    select 1 from public.task_states
    where id = old.state_id and is_completed
  ) then
    return new;
  end if;

  if new.recurrence_interval is null
     or new.recurrence_unit is null
     or new.due_date is null then
    return new;
  end if;

  next_due_date := case new.recurrence_unit
    when 'day' then new.due_date + new.recurrence_interval
    when 'week' then new.due_date + (new.recurrence_interval * 7)
    when 'month' then (new.due_date + (new.recurrence_interval || ' months')::interval)::date
  end;

  if new.recurrence_until is not null and next_due_date > new.recurrence_until then
    return new;
  end if;

  select id into next_state_id
  from public.task_states
  where not is_completed
  order by sort_order
  limit 1;
  if next_state_id is null then
    return new;
  end if;

  series_id := coalesce(new.recurrence_source_id, new.id);
  insert into public.tasks (
    project_id, state_id, parent_task_id, title, description, assigned_to,
    priority, estimate_minutes, due_date, recurrence_interval,
    recurrence_unit, recurrence_until, recurrence_source_id, tags
  )
  values (
    new.project_id, next_state_id, new.parent_task_id, new.title,
    new.description, new.assigned_to, new.priority, new.estimate_minutes,
    next_due_date, new.recurrence_interval, new.recurrence_unit,
    new.recurrence_until, series_id, new.tags
  )
  on conflict (recurrence_source_id, due_date)
    where recurrence_source_id is not null and due_date is not null
  do nothing
  returning id into next_task_id;

  if next_task_id is not null then
    insert into public.task_projects (task_id, project_id)
    select next_task_id, task_projects.project_id
    from public.task_projects
    where task_projects.task_id = new.id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.spawn_next_recurring_task() from public, anon, authenticated;
drop trigger if exists on_task_completion_spawn_recurrence on public.tasks;
create trigger on_task_completion_spawn_recurrence
after update of state_id on public.tasks
for each row execute procedure public.spawn_next_recurring_task();

create or replace function public.prevent_task_dependency_cycles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(721459, 1);

  if exists (
    with recursive dependency_path(task_id) as (
      select new.depends_on_task_id
      union
      select dependency.depends_on_task_id
      from public.task_dependencies as dependency
      join dependency_path as path on dependency.task_id = path.task_id
    )
    select 1 from dependency_path where task_id = new.task_id
  ) then
    raise exception 'Task dependencies cannot contain a cycle';
  end if;

  if exists (
    select 1
    from public.tasks as dependent
    join public.task_states as dependent_state on dependent_state.id = dependent.state_id
    join public.tasks as prerequisite on prerequisite.id = new.depends_on_task_id
    join public.task_states as prerequisite_state on prerequisite_state.id = prerequisite.state_id
    where dependent.id = new.task_id
      and dependent_state.is_completed
      and not prerequisite_state.is_completed
  ) then
    raise exception 'A completed task cannot depend on an incomplete task';
  end if;

  return new;
end;
$$;

drop trigger if exists task_dependency_cycle_guard on public.task_dependencies;
create trigger task_dependency_cycle_guard
before insert or update on public.task_dependencies
for each row execute procedure public.prevent_task_dependency_cycles();

create or replace function public.prevent_blocked_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.task_states as next_state
    where next_state.id = new.state_id
      and next_state.is_completed
  ) and exists (
    select 1
    from public.task_dependencies as dependency
    join public.tasks as prerequisite on prerequisite.id = dependency.depends_on_task_id
    join public.task_states as prerequisite_state on prerequisite_state.id = prerequisite.state_id
    where dependency.task_id = new.id
      and not prerequisite_state.is_completed
  ) then
    raise exception 'This task is blocked by incomplete dependencies';
  end if;
  return new;
end;
$$;

drop trigger if exists task_completion_blocked_guard on public.tasks;
create trigger task_completion_blocked_guard
before update of state_id on public.tasks
for each row execute procedure public.prevent_blocked_task_completion();

insert into public.task_states (name, color, sort_order, is_completed)
values
  ('Backlog', 'slate', 10, false),
  ('Todo', 'blue', 20, false),
  ('In progress', 'amber', 30, false),
  ('Review', 'violet', 40, false),
  ('Done', 'emerald', 50, true)
on conflict (name) do update set color = excluded.color, sort_order = excluded.sort_order, is_completed = excluded.is_completed;

insert into public.clients (id, name, email, company, notes)
values
  ('10000000-0000-0000-0000-000000000001', 'Northstar Health', 'hello@northstar.example', 'Northstar Health', 'Website redesign and content migration.'),
  ('10000000-0000-0000-0000-000000000002', 'Acme Retail', 'ops@acme.example', 'Acme Retail', 'Internal operations dashboard.')
on conflict (id) do nothing;

insert into public.projects (id, client_id, name, code, description, status, due_date, budget)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Northstar Portal', 'NSP', 'A clearer patient portal experience.', 'active', current_date + 42, 42000),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Retail Ops', 'OPS', 'Reporting and workflow tooling for store teams.', 'planning', current_date + 70, 28000)
on conflict (id) do nothing;

-- Sample tasks are unassigned so they appear before a user assigns them.
insert into public.tasks (project_id, state_id, title, description, priority, estimate_minutes, due_date, tags)
select
  '20000000-0000-0000-0000-000000000001',
  (select id from public.task_states where name = 'In progress'),
  'Audit portal navigation',
  'Review the current information architecture and identify the highest-friction paths.',
  'high', 120, current_date + 5, array['research', 'ux']
where not exists (select 1 from public.tasks where title = 'Audit portal navigation');

insert into public.tasks (project_id, state_id, title, description, priority, estimate_minutes, due_date, tags)
select
  '20000000-0000-0000-0000-000000000002',
  (select id from public.task_states where name = 'Todo'),
  'Define dashboard metrics',
  'Agree on the first release metrics with the operations team.',
  'medium', 90, current_date + 9, array['planning']
where not exists (select 1 from public.tasks where title = 'Define dashboard metrics');

-- Set assigned_to manually after a real Supabase Auth user exists:
-- update public.tasks set assigned_to = 'YOUR-AUTH-USER-UUID' where title = 'Audit portal navigation';
