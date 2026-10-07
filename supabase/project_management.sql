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
declare
  table_name text;
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
    select distinct profile.id, task.workspace_id
    from public.profiles as profile
    cross join lateral regexp_matches(
      new.note,
      '@([[:alnum:]_.-]+)',
      'gi'
    ) as matches(captured)
    join public.tasks as task
      on task.id = new.task_id
    where lower(profile.username) = lower(matches.captured[1])
      and coalesce((profile.notification_preferences ->> 'mention')::boolean, true)
      and exists (
        select 1
        from public.workspace_members as member
        where member.workspace_id = task.workspace_id
          and member.user_id = profile.id
      )
  loop
    insert into public.notifications (
      workspace_id, recipient_id, actor_id, task_id, kind, title, body
    )
    values (
      mention.workspace_id,
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

  if not coalesce((
    select (profile.notification_preferences ->> 'assignment')::boolean
    from public.profiles as profile
    where profile.id = new.assigned_to
  ), true) then
    return new;
  end if;

  insert into public.notifications (
    workspace_id, recipient_id, actor_id, task_id, kind, title, body
  )
  values (
    new.workspace_id,
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

create or replace function public.get_workspace_dashboard_summary(
  p_workspace_id uuid,
  p_today date
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with scoped_tasks as (
    select
      task.id,
      task.title,
      task.priority,
      task.due_date,
      task.project_id,
      state.id as state_id,
      state.name as state_name,
      state.color as state_color,
      state.sort_order as state_sort_order,
      state.is_completed,
      project.name as project_name,
      project.code as project_code
    from public.tasks as task
    join public.task_states as state on state.id = task.state_id
    left join public.projects as project on project.id = task.project_id
    where task.workspace_id = p_workspace_id
      and p_workspace_id = (select public.active_workspace_id())
  ),
  task_counts as (
    select
      count(*) as total_count,
      count(*) filter (where not is_completed) as current_count,
      count(*) filter (where is_completed) as completed_count,
      count(*) filter (
        where not is_completed
          and due_date >= p_today
          and due_date <= p_today + 7
      ) as due_soon_count,
      count(*) filter (
        where not is_completed and due_date < p_today
      ) as overdue_count
    from scoped_tasks
  ),
  workspace_totals as (
    select
      (
        select count(*)
        from public.clients as client
        where client.workspace_id = p_workspace_id
          and p_workspace_id = (select public.active_workspace_id())
      ) as client_count,
      (
        select count(*)
        from public.projects as project
        where project.workspace_id = p_workspace_id
          and p_workspace_id = (select public.active_workspace_id())
      ) as project_count
  ),
  attention_tasks as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', task.id,
          'title', task.title,
          'priority', task.priority,
          'due_date', task.due_date,
          'state', jsonb_build_object(
            'is_completed', task.is_completed
          ),
          'project', case
            when task.project_id is null then null
            else jsonb_build_object(
              'id', task.project_id,
              'name', task.project_name,
              'code', task.project_code
            )
          end
        )
        order by
          case when task.due_date < p_today then 0 else 1 end,
          task.due_date,
          task.id
      ),
      '[]'::jsonb
    ) as items
    from (
      select *
      from scoped_tasks
      where not is_completed
        and due_date <= p_today + 7
      order by
        case when due_date < p_today then 0 else 1 end,
        due_date,
        id
      limit 6
    ) as task
  ),
  project_progress as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'project', jsonb_build_object(
            'id', project_id,
            'name', project_name
          ),
          'total', total_count,
          'completed', completed_count
        )
        order by total_count desc, project_name
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        project_id,
        project_name,
        count(*) as total_count,
        count(*) filter (where is_completed) as completed_count
      from scoped_tasks
      where project_id is not null
      group by project_id, project_name
    ) as progress
  ),
  project_options as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('id', project.id, 'name', project.name, 'code', project.code)
        order by project.name
      ),
      '[]'::jsonb
    ) as items
    from public.projects as project
    where project.workspace_id = p_workspace_id
      and p_workspace_id = (select public.active_workspace_id())
  ),
  recent_activity as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', activity.id,
          'task_id', activity.task_id,
          'action', activity.action,
          'created_at', activity.created_at,
          'task', jsonb_build_object(
            'id', activity.task_id,
            'title', activity.task_title,
            'project', case
              when activity.project_id is null then null
              else jsonb_build_object(
                'id', activity.project_id,
                'name', activity.project_name,
                'code', activity.project_code
              )
            end,
            'linked_projects', activity.linked_projects
          )
        )
        order by activity.created_at desc, activity.id desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        history.id,
        history.task_id,
        history.action,
        history.created_at,
        task.title as task_title,
        task.project_id,
        project.name as project_name,
        project.code as project_code,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'project',
                jsonb_build_object(
                  'id', linked_project.id,
                  'name', linked_project.name,
                  'code', linked_project.code
                )
              )
              order by linked_project.name
            )
            from public.task_projects as task_project
            join public.projects as linked_project
              on linked_project.id = task_project.project_id
            where task_project.task_id = task.id
          ),
          '[]'::jsonb
        ) as linked_projects
      from public.task_history as history
      join public.tasks as task on task.id = history.task_id
      left join public.projects as project on project.id = task.project_id
      where history.workspace_id = p_workspace_id
        and history.user_id = (select auth.uid())
        and p_workspace_id = (select public.active_workspace_id())
      order by history.created_at desc, history.id desc
      limit 6
    ) as activity
  ),
  activity_actions as (
    select coalesce(jsonb_agg(distinct history.action), '[]'::jsonb) as items
    from public.task_history as history
    where history.workspace_id = p_workspace_id
      and history.user_id = (select auth.uid())
      and p_workspace_id = (select public.active_workspace_id())
  ),
  activity_counts as (
    select
      count(*) filter (where history.created_at >= now() - interval '7 days')
        as current_week_count,
      count(*) filter (
        where history.created_at >= now() - interval '14 days'
          and history.created_at < now() - interval '7 days'
      ) as previous_week_count
    from public.task_history as history
    where history.workspace_id = p_workspace_id
      and history.user_id = (select auth.uid())
      and p_workspace_id = (select public.active_workspace_id())
  )
  select jsonb_build_object(
    'clientCount', workspace_totals.client_count,
    'projectCount', workspace_totals.project_count,
    'totalTaskCount', task_counts.total_count,
    'currentTaskCount', task_counts.current_count,
    'completedTaskCount', task_counts.completed_count,
    'dueSoonCount', task_counts.due_soon_count,
    'overdueCount', task_counts.overdue_count,
    'attentionTasks', attention_tasks.items,
    'projectProgress', project_progress.items,
    'projectOptions', project_options.items,
    'activity', recent_activity.items,
    'activityActions', activity_actions.items,
    'thisWeekActivity', activity_counts.current_week_count,
    'previousWeekActivity', activity_counts.previous_week_count
  )
  from task_counts
  cross join workspace_totals
  cross join attention_tasks
  cross join project_progress
  cross join project_options
  cross join recent_activity
  cross join activity_actions
  cross join activity_counts;
$$;

create or replace function public.get_workspace_team_workload(
  p_workspace_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  assigned_to uuid,
  task_count bigint,
  estimated_minutes bigint,
  tasks_without_estimate bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    task.assigned_to,
    count(*) as task_count,
    coalesce(sum(task.estimate_minutes), 0)::bigint as estimated_minutes,
    count(*) filter (
      where task.estimate_minutes is null or task.estimate_minutes = 0
    ) as tasks_without_estimate
  from public.tasks as task
  join public.task_states as state on state.id = task.state_id
  where task.workspace_id = p_workspace_id
    and p_workspace_id = (select public.active_workspace_id())
    and task.due_date >= p_start_date
    and task.due_date <= p_end_date
    and not state.is_completed
  group by task.assigned_to;
$$;

revoke execute on function public.get_workspace_dashboard_summary(uuid, date) from public, anon;
grant execute on function public.get_workspace_dashboard_summary(uuid, date) to authenticated;
revoke execute on function public.get_workspace_team_workload(uuid, date, date) from public, anon;
grant execute on function public.get_workspace_team_workload(uuid, date, date) to authenticated;
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
on conflict do nothing;

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

-- Workspaces and optional workflow extensions. Existing rows remain together
-- in the shared default workspace; new workspaces are isolated by membership.
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  owner_id uuid references auth.users(id) on delete set null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists workspaces_single_default_idx
  on public.workspaces (is_default) where is_default;

insert into public.workspaces (name, is_default)
values ('Shared workspace', true)
on conflict (is_default) where is_default do nothing;

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.workspace_members'::regclass
      and conname = 'workspace_members_user_id_profiles_fkey'
  ) then
    alter table public.workspace_members
      add constraint workspace_members_user_id_profiles_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;
notify pgrst, 'reload schema';

alter table public.profiles
  add column if not exists active_workspace_id uuid references public.workspaces(id) on delete set null,
  add column if not exists notification_preferences jsonb not null default '{"mention":true,"assignment":true,"reminder":true,"overdue":true}'::jsonb,
  add column if not exists digest_frequency text not null default 'off';
alter table public.profiles drop constraint if exists profiles_digest_frequency_check;
alter table public.profiles add constraint profiles_digest_frequency_check
  check (digest_frequency in ('off', 'daily', 'weekly'));
alter table public.profiles drop constraint if exists profiles_notification_preferences_check;
alter table public.profiles add constraint profiles_notification_preferences_check
  check (
    jsonb_typeof(notification_preferences) = 'object'
    and (not (notification_preferences ? 'mention') or jsonb_typeof(notification_preferences -> 'mention') = 'boolean')
    and (not (notification_preferences ? 'assignment') or jsonb_typeof(notification_preferences -> 'assignment') = 'boolean')
    and (not (notification_preferences ? 'reminder') or jsonb_typeof(notification_preferences -> 'reminder') = 'boolean')
    and (not (notification_preferences ? 'overdue') or jsonb_typeof(notification_preferences -> 'overdue') = 'boolean')
  );

alter table public.clients add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.projects add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.task_states add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.tasks add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.task_history add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.task_projects add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.project_clients add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.task_dependencies add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.project_milestones add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.task_templates add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.notifications add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.projects drop constraint if exists projects_code_key;
alter table public.task_states drop constraint if exists task_states_name_key;
create unique index if not exists projects_workspace_code_idx on public.projects(workspace_id, code);
create unique index if not exists task_states_workspace_name_idx on public.task_states(workspace_id, name);

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = target_workspace_id
      and member.user_id = (select auth.uid())
      and (allowed_roles is null or member.role = any (allowed_roles))
  );
$$;

create or replace function public.active_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profile.active_workspace_id
     from public.profiles as profile
     where profile.id = (select auth.uid())),
    (select workspace.id from public.workspaces as workspace where workspace.is_default)
  );
$$;

create or replace function public.find_workspace_user(target_username text)
returns table (id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select profile.id, profile.username, profile.display_name
  from public.profiles as profile
  where (select auth.uid()) is not null
    and length(trim(target_username)) between 1 and 128
    and public.has_workspace_role(
      (select public.active_workspace_id()),
      array['owner', 'admin']
    )
    and profile.username = lower(trim(target_username))
  limit 1;
$$;

create or replace function public.update_workspace_member_profile(
  p_workspace_id uuid,
  p_user_id uuid,
  p_display_name text,
  p_weekly_capacity_minutes integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_role text;
  target_role text;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workspace_id is null or p_user_id is null then
    raise exception 'Workspace and user are required' using errcode = '22023';
  end if;
  if p_display_name is null or length(trim(p_display_name)) = 0 then
    raise exception 'Display name is required' using errcode = '22023';
  end if;
  if length(trim(p_display_name)) > 120 then
    raise exception 'Display name must be 120 characters or fewer' using errcode = '22023';
  end if;
  if p_weekly_capacity_minutes is null or p_weekly_capacity_minutes <= 0 then
    raise exception 'Weekly capacity must be positive' using errcode = '22023';
  end if;

  select member.role
  into actor_role
  from public.workspace_members as member
  where member.workspace_id = p_workspace_id
    and member.user_id = actor_id;

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Workspace admin access required' using errcode = '42501';
  end if;

  select member.role
  into target_role
  from public.workspace_members as member
  where member.workspace_id = p_workspace_id
    and member.user_id = p_user_id;

  if target_role is null then
    raise exception 'User is not a member of this workspace' using errcode = '42501';
  end if;
  if target_role = 'owner' and actor_role <> 'owner' then
    raise exception 'Only the workspace owner can edit the owner profile' using errcode = '42501';
  end if;

  update public.profiles as profile
  set display_name = trim(p_display_name),
      weekly_capacity_minutes = p_weekly_capacity_minutes,
      updated_at = now()
  where profile.id = p_user_id;

  if not found then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.has_workspace_role(uuid, text[]) from public, anon;
revoke all on function public.active_workspace_id() from public, anon;
revoke all on function public.find_workspace_user(text) from public, anon;
revoke all on function public.update_workspace_member_profile(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function public.active_workspace_id() to authenticated;
grant execute on function public.find_workspace_user(text) to authenticated;
grant execute on function public.update_workspace_member_profile(uuid, uuid, text, integer) to authenticated;

update public.clients set workspace_id = (select id from public.workspaces where is_default) where workspace_id is null;
update public.projects set workspace_id = (select id from public.workspaces where is_default) where workspace_id is null;
update public.task_states set workspace_id = (select id from public.workspaces where is_default) where workspace_id is null;
update public.tasks set workspace_id = (select workspace_id from public.projects where id = tasks.project_id) where workspace_id is null;
update public.task_history set workspace_id = (select workspace_id from public.tasks where id = task_history.task_id) where workspace_id is null;
update public.task_projects set workspace_id = (select workspace_id from public.tasks where id = task_projects.task_id) where workspace_id is null;
update public.project_clients set workspace_id = (select workspace_id from public.projects where id = project_clients.project_id) where workspace_id is null;
update public.task_dependencies set workspace_id = (select workspace_id from public.tasks where id = task_dependencies.task_id) where workspace_id is null;
update public.project_milestones set workspace_id = (select workspace_id from public.projects where id = project_milestones.project_id) where workspace_id is null;
update public.task_templates set workspace_id = (select id from public.workspaces where is_default) where workspace_id is null;
update public.notifications set workspace_id = (select workspace_id from public.tasks where id = notifications.task_id) where workspace_id is null and task_id is not null;
update public.notifications set workspace_id = (select id from public.workspaces where is_default) where workspace_id is null;

insert into public.workspace_members (workspace_id, user_id, role)
select workspace.id, users.id,
  case when users.id = (select id from auth.users order by created_at, id limit 1)
    then 'owner' else 'editor' end
from public.workspaces as workspace
cross join auth.users as users
where workspace.is_default
on conflict (workspace_id, user_id) do nothing;

update public.profiles
set active_workspace_id = (select id from public.workspaces where is_default)
where active_workspace_id is null;

alter table public.clients alter column workspace_id set not null;
alter table public.projects alter column workspace_id set not null;
alter table public.task_states alter column workspace_id set not null;
alter table public.tasks alter column workspace_id set not null;
alter table public.task_history alter column workspace_id set not null;
alter table public.task_projects alter column workspace_id set not null;
alter table public.project_clients alter column workspace_id set not null;
alter table public.task_dependencies alter column workspace_id set not null;
alter table public.project_milestones alter column workspace_id set not null;
alter table public.task_templates alter column workspace_id set not null;
alter table public.notifications alter column workspace_id set not null;
alter table public.clients alter column workspace_id set default public.active_workspace_id();
alter table public.projects alter column workspace_id set default public.active_workspace_id();
alter table public.task_states alter column workspace_id set default public.active_workspace_id();
alter table public.tasks alter column workspace_id set default public.active_workspace_id();
alter table public.task_history alter column workspace_id set default public.active_workspace_id();
alter table public.task_projects alter column workspace_id set default public.active_workspace_id();
alter table public.project_clients alter column workspace_id set default public.active_workspace_id();
alter table public.task_dependencies alter column workspace_id set default public.active_workspace_id();
alter table public.project_milestones alter column workspace_id set default public.active_workspace_id();
alter table public.task_templates alter column workspace_id set default public.active_workspace_id();
alter table public.notifications alter column workspace_id drop default;

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_by uuid not null references auth.users(id) on delete cascade,
  template jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  from_state_id uuid references public.task_states(id) on delete cascade,
  to_state_id uuid references public.task_states(id) on delete cascade,
  action text not null check (action in ('set_priority', 'assign_to')),
  action_value text not null,
  enabled boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.workspace_automations drop constraint if exists workspace_automations_action_value_check;
alter table public.workspace_automations add constraint workspace_automations_action_value_check
  check (action <> 'set_priority' or action_value in ('low', 'medium', 'high', 'urgent'));

create index if not exists clients_workspace_idx on public.clients(workspace_id, created_at desc);
create index if not exists projects_workspace_idx on public.projects(workspace_id, updated_at desc);
create index if not exists tasks_workspace_due_idx on public.tasks(workspace_id, due_date, id);
create index if not exists tasks_workspace_assignee_due_idx on public.tasks(workspace_id, assigned_to, due_date, id);
create index if not exists task_history_workspace_created_idx on public.task_history(workspace_id, created_at desc, id);
create index if not exists task_history_workspace_user_created_idx on public.task_history(workspace_id, user_id, created_at desc, id);
create index if not exists workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index if not exists workspace_automations_trigger_idx on public.workspace_automations(workspace_id, from_state_id, to_state_id) where enabled;

create or replace function public.text_array_to_search_text(tag_items text[])
returns text
language plpgsql
immutable
parallel safe
set search_path = ''
as $$
declare
  tag_item text;
  result text := '';
begin
  if tag_items is null then return result; end if;
  foreach tag_item in array tag_items loop
    if tag_item is not null then
      result := result || ' ' || tag_item;
    end if;
  end loop;
  return result;
end;
$$;
revoke all on function public.text_array_to_search_text(text[]) from public, anon;
grant execute on function public.text_array_to_search_text(text[]) to authenticated, service_role;

alter table public.tasks
  add column if not exists search_document tsvector
  generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' ||
      public.text_array_to_search_text(tags)
    )
  ) stored;
create index if not exists tasks_search_document_idx
  on public.tasks using gin(search_document);

create or replace function public.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.workspace_members(workspace_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (workspace_id, user_id) do update set role = 'owner';
  end if;
  insert into public.task_states(workspace_id, name, color, sort_order, is_completed)
  select new.id, defaults.name, defaults.color, defaults.sort_order, defaults.is_completed
  from (values
    ('Backlog', 'slate', 10, false),
    ('Todo', 'blue', 20, false),
    ('In progress', 'amber', 30, false),
    ('Review', 'violet', 40, false),
    ('Done', 'emerald', 50, true)
  ) as defaults(name, color, sort_order, is_completed)
  on conflict (workspace_id, name) do nothing;
  return new;
end;
$$;

revoke all on function public.add_workspace_owner() from public, anon, authenticated;
drop trigger if exists workspace_created_initialize on public.workspaces;
create trigger workspace_created_initialize
after insert on public.workspaces
for each row execute procedure public.add_workspace_owner();

create or replace function public.set_active_workspace_default()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_workspace uuid;
begin
  select id into default_workspace from public.workspaces where is_default;
  insert into public.workspace_members(workspace_id, user_id, role)
  values (
    default_workspace,
    new.id,
    case when exists (
      select 1 from public.workspace_members
      where workspace_id = default_workspace and role = 'owner'
    ) then 'editor' else 'owner' end
  )
  on conflict (workspace_id, user_id) do nothing;
  update public.profiles
    set active_workspace_id = default_workspace
    where id = new.id and active_workspace_id is null;
  return new;
end;
$$;

revoke all on function public.set_active_workspace_default() from public, anon, authenticated;
drop trigger if exists on_auth_user_join_default_workspace on auth.users;
create trigger on_auth_user_join_default_workspace
after insert on auth.users
for each row execute procedure public.set_active_workspace_default();

create or replace function public.assign_row_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_workspace uuid;
begin
  if tg_table_name = 'tasks' then
    select project.workspace_id into expected_workspace
    from public.projects as project where project.id = new.project_id;
  elsif tg_table_name = 'task_history' then
    select task.workspace_id into expected_workspace
    from public.tasks as task where task.id = new.task_id;
  elsif tg_table_name = 'task_projects' or tg_table_name = 'task_dependencies' then
    select task.workspace_id into expected_workspace
    from public.tasks as task where task.id = new.task_id;
  elsif tg_table_name = 'project_clients' or tg_table_name = 'project_milestones' then
    select project.workspace_id into expected_workspace
    from public.projects as project where project.id = new.project_id;
  elsif tg_table_name = 'notifications' then
    if new.task_id is not null then
      select task.workspace_id into expected_workspace
      from public.tasks as task where task.id = new.task_id;
    else
      expected_workspace := coalesce(new.workspace_id, public.active_workspace_id(),
        (select id from public.workspaces where is_default));
    end if;
  else
    expected_workspace := coalesce(new.workspace_id, public.active_workspace_id(),
      (select id from public.workspaces where is_default));
  end if;

  if expected_workspace is null then
    raise exception 'Could not resolve workspace for %', tg_table_name;
  end if;
  if tg_table_name = 'notifications' and new.task_id is not null then
    new.workspace_id := expected_workspace;
  end if;
  if new.workspace_id is not null and new.workspace_id <> expected_workspace then
    raise exception 'Workspace does not match the related record';
  end if;
  new.workspace_id := expected_workspace;

  if tg_table_name = 'projects' then
    if not exists (
      select 1 from public.clients as client
      where client.id = new.client_id and client.workspace_id = new.workspace_id
    ) then
      raise exception 'Project client must belong to the same workspace';
    end if;
  elsif tg_table_name = 'tasks' then
    if not exists (
      select 1 from public.task_states as state
      where state.id = new.state_id and state.workspace_id = new.workspace_id
    ) then
      raise exception 'Task state must belong to the same workspace';
    end if;
    if new.assigned_to is not null and not exists (
      select 1 from public.workspace_members as member
      where member.workspace_id = new.workspace_id and member.user_id = new.assigned_to
    ) then
      raise exception 'Task assignee must be a member of the same workspace';
    end if;
  elsif tg_table_name = 'task_projects' then
    if not exists (
      select 1 from public.projects as project
      where project.id = new.project_id and project.workspace_id = new.workspace_id
    ) then
      raise exception 'Linked project must belong to the same workspace';
    end if;
  elsif tg_table_name = 'task_dependencies' then
    if not exists (
      select 1 from public.tasks as prerequisite
      where prerequisite.id = new.depends_on_task_id
        and prerequisite.workspace_id = new.workspace_id
    ) then
      raise exception 'Dependency tasks must belong to the same workspace';
    end if;
  elsif tg_table_name = 'project_clients' then
    if not exists (
      select 1 from public.clients as client
      where client.id = new.client_id and client.workspace_id = new.workspace_id
    ) then
      raise exception 'Linked client must belong to the same workspace';
    end if;
  elsif tg_table_name = 'workspace_automations' then
    if new.action = 'assign_to' and not exists (
      select 1 from public.workspace_members as member
      where member.workspace_id = new.workspace_id
        and member.user_id = new.action_value::uuid
    ) then
      raise exception 'Automation assignee must be a member of the same workspace';
    end if;
    if (new.from_state_id is not null and not exists (
        select 1 from public.task_states as state
        where state.id = new.from_state_id and state.workspace_id = new.workspace_id
      ))
      or (new.to_state_id is not null and not exists (
        select 1 from public.task_states as state
        where state.id = new.to_state_id and state.workspace_id = new.workspace_id
      )) then
      raise exception 'Automation states must belong to the same workspace';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_row_workspace() from public, anon, authenticated;
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clients', 'projects', 'task_states', 'tasks', 'task_history',
    'task_projects', 'project_clients', 'task_dependencies',
    'project_milestones', 'task_templates', 'notifications',
    'project_templates', 'workspace_automations'
  ] loop
    execute format('drop trigger if exists assign_workspace on public.%I', table_name);
    execute format('create trigger assign_workspace before insert or update on public.%I for each row execute procedure public.assign_row_workspace()', table_name);
  end loop;
end
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.project_templates enable row level security;
alter table public.workspace_automations enable row level security;

revoke all on table public.workspaces, public.workspace_members,
  public.project_templates, public.workspace_automations from anon, public;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.project_templates to authenticated;
grant select, insert, update, delete on table public.workspace_automations to authenticated;
grant insert, update on table public.notifications to authenticated;
grant update on table public.task_history to authenticated;

drop policy if exists "workspace members can read workspaces" on public.workspaces;
create policy "workspace members can read workspaces" on public.workspaces
for select to authenticated
using (owner_id = (select auth.uid()) or public.has_workspace_role(id));
drop policy if exists "users can create workspaces" on public.workspaces;
create policy "users can create workspaces" on public.workspaces
for insert to authenticated with check (owner_id = (select auth.uid()) and not is_default);
drop policy if exists "workspace admins can update workspaces" on public.workspaces;
create policy "workspace admins can update workspaces" on public.workspaces
for update to authenticated using (public.has_workspace_role(id, array['owner', 'admin']))
with check (public.has_workspace_role(id, array['owner', 'admin']));
drop policy if exists "workspace owners can delete workspaces" on public.workspaces;
create policy "workspace owners can delete workspaces" on public.workspaces
for delete to authenticated using (not is_default and public.has_workspace_role(id, array['owner']));

drop policy if exists "members can read workspace memberships" on public.workspace_members;
create policy "members can read workspace memberships" on public.workspace_members
for select to authenticated using (public.has_workspace_role(workspace_id));
drop policy if exists "workspace admins can add members" on public.workspace_members;
create policy "workspace admins can add members" on public.workspace_members
for insert to authenticated with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  and role <> 'owner'
);
drop policy if exists "workspace admins can update members" on public.workspace_members;
create policy "workspace admins can update members" on public.workspace_members
for update to authenticated using (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
) with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  and role <> 'owner'
);
drop policy if exists "workspace admins can remove members" on public.workspace_members;
create policy "workspace admins can remove members" on public.workspace_members
for delete to authenticated using (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  and role <> 'owner'
);

drop policy if exists "members can read clients" on public.clients;
create policy "members can read clients" on public.clients for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "editors can manage clients" on public.clients;
create policy "editors can manage clients" on public.clients for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read clients" on public.clients;
drop policy if exists "authenticated users can create clients" on public.clients;
drop policy if exists "members can read projects" on public.projects;
create policy "members can read projects" on public.projects for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "editors can manage projects" on public.projects;
create policy "editors can manage projects" on public.projects for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));
drop policy if exists "authenticated users can read projects" on public.projects;
drop policy if exists "authenticated users can create projects" on public.projects;

drop policy if exists "members can read task states" on public.task_states;
create policy "members can read task states" on public.task_states for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "editors can manage task states" on public.task_states;
create policy "editors can manage task states" on public.task_states for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));
drop policy if exists "authenticated users can read task states" on public.task_states;

drop policy if exists "authenticated users can read all tasks" on public.tasks;
drop policy if exists "authenticated users can create tasks" on public.tasks;
drop policy if exists "authenticated users can update tasks" on public.tasks;
drop policy if exists "users can read assigned tasks" on public.tasks;
drop policy if exists "users can create tasks" on public.tasks;
drop policy if exists "users can update assigned tasks" on public.tasks;
drop policy if exists "members can read tasks" on public.tasks;
create policy "members can read tasks" on public.tasks for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "editors can manage tasks" on public.tasks;
create policy "editors can manage tasks" on public.tasks for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read profiles" on public.profiles;
drop policy if exists "members can read profiles" on public.profiles;
drop policy if exists "authenticated users can find profiles for workspace membership" on public.profiles;
create policy "authenticated users can find profiles for workspace membership" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members as member
    where member.workspace_id = (select public.active_workspace_id())
      and member.user_id = profiles.id
  )
);
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and public.has_workspace_role(active_workspace_id));

drop policy if exists "authenticated users can read task history" on public.task_history;
drop policy if exists "users can manage own task history" on public.task_history;
drop policy if exists "users can update own task history" on public.task_history;
create policy "members can read task history" on public.task_history for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "members can add own task history" on public.task_history for insert to authenticated
with check (user_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "users can update own task history" on public.task_history for update to authenticated
using (user_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id))
with check (user_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));

drop policy if exists "authenticated users can read task projects" on public.task_projects;
drop policy if exists "authenticated users can manage task projects" on public.task_projects;
create policy "members can read task projects" on public.task_projects for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "editors can manage task projects" on public.task_projects for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read project clients" on public.project_clients;
drop policy if exists "authenticated users can manage project clients" on public.project_clients;
create policy "members can read project clients" on public.project_clients for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "editors can manage project clients" on public.project_clients for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read task dependencies" on public.task_dependencies;
drop policy if exists "users can create task dependencies" on public.task_dependencies;
drop policy if exists "authenticated users can remove task dependencies" on public.task_dependencies;
drop policy if exists "users can remove task dependencies" on public.task_dependencies;
create policy "members can read task dependencies" on public.task_dependencies for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "editors can manage task dependencies" on public.task_dependencies for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read milestones" on public.project_milestones;
drop policy if exists "authenticated users can manage milestones" on public.project_milestones;
create policy "members can read milestones" on public.project_milestones for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "editors can manage milestones" on public.project_milestones for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "authenticated users can read task templates" on public.task_templates;
drop policy if exists "users can create task templates" on public.task_templates;
drop policy if exists "users can update own task templates" on public.task_templates;
drop policy if exists "users can delete own task templates" on public.task_templates;
create policy "members can read task templates" on public.task_templates for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
create policy "editors can manage task templates" on public.task_templates for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "users can read own notifications" on public.notifications;
drop policy if exists "users can mark own notifications read" on public.notifications;
drop policy if exists "users can create own reminder notifications" on public.notifications;
create policy "users can read own notifications" on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()));
create policy "users can update own notifications" on public.notifications for update to authenticated
using (recipient_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()))
with check (recipient_id = (select auth.uid()) and workspace_id = (select public.active_workspace_id()));
create policy "users can create own reminder notifications" on public.notifications for insert to authenticated
with check (recipient_id = (select auth.uid()) and actor_id = (select auth.uid())
  and kind in ('reminder', 'overdue') and workspace_id = (select public.active_workspace_id()));

drop policy if exists "members can read project templates" on public.project_templates;
create policy "members can read project templates" on public.project_templates for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "editors can manage project templates" on public.project_templates;
create policy "editors can manage project templates" on public.project_templates for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

drop policy if exists "members can read workspace automations" on public.workspace_automations;
create policy "members can read workspace automations" on public.workspace_automations for select to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id));
drop policy if exists "admins can manage workspace automations" on public.workspace_automations;
create policy "admins can manage workspace automations" on public.workspace_automations for all to authenticated
using (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (workspace_id = (select public.active_workspace_id()) and public.has_workspace_role(workspace_id, array['owner', 'admin']));

create or replace function public.apply_workspace_automation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule record;
begin
  if new.state_id is not distinct from old.state_id then return new; end if;
  for rule in
    select automation.action, automation.action_value
    from public.workspace_automations as automation
    where automation.workspace_id = new.workspace_id
      and automation.enabled
      and (automation.from_state_id is null or automation.from_state_id = old.state_id)
      and (automation.to_state_id is null or automation.to_state_id = new.state_id)
  loop
    if rule.action = 'set_priority' then
      update public.tasks set priority = rule.action_value where id = new.id;
    elsif rule.action = 'assign_to' then
      update public.tasks set assigned_to = rule.action_value::uuid where id = new.id;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.apply_workspace_automation() from public, anon, authenticated;

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
    where id = new.state_id and workspace_id = new.workspace_id and is_completed
  ) or exists (
    select 1 from public.task_states
    where id = old.state_id and workspace_id = old.workspace_id and is_completed
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
  where workspace_id = new.workspace_id and not is_completed
  order by sort_order
  limit 1;
  if next_state_id is null then return new; end if;

  series_id := coalesce(new.recurrence_source_id, new.id);
  insert into public.tasks (
    workspace_id, project_id, state_id, parent_task_id, title, description,
    assigned_to, priority, estimate_minutes, due_date, recurrence_interval,
    recurrence_unit, recurrence_until, recurrence_source_id, tags
  )
  values (
    new.workspace_id, new.project_id, next_state_id, new.parent_task_id,
    new.title, new.description, new.assigned_to, new.priority,
    new.estimate_minutes, next_due_date, new.recurrence_interval,
    new.recurrence_unit, new.recurrence_until, series_id, new.tags
  )
  on conflict (recurrence_source_id, due_date)
    where recurrence_source_id is not null and due_date is not null
  do nothing
  returning id into next_task_id;

  if next_task_id is not null then
    insert into public.task_projects (workspace_id, task_id, project_id)
    select new.workspace_id, next_task_id, task_projects.project_id
    from public.task_projects
    where task_projects.task_id = new.id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.spawn_next_recurring_task() from public, anon, authenticated;
drop trigger if exists apply_workspace_automation on public.tasks;
create trigger apply_workspace_automation
after update of state_id on public.tasks
for each row execute procedure public.apply_workspace_automation();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'workspaces', 'workspace_members', 'project_templates', 'workspace_automations'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
