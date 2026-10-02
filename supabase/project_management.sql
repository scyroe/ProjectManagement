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
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

-- Adds the user_email column for installs where task_history already existed.
alter table public.task_history add column if not exists user_email text;

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

-- Lets the app's Supabase Realtime subscription pick up changes made outside
-- the app (other tabs/users, direct SQL) and invalidate its client-side cache.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'clients', 'projects', 'project_clients',
    'tasks', 'task_projects', 'task_states', 'task_history'
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
