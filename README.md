# ProjectManagement

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
pnpm dev
```

Build the app for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!

## Supabase setup

Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY` in `.env.local`. Use a
Supabase publishable/anon key; never use a service-role key in this browser app.

Apply [supabase/project_management.sql](./supabase/project_management.sql) in
the Supabase SQL editor before using the app. It creates or extends the schema,
policies, and triggers needed for workspaces and role-based membership,
profiles, notifications, recurring tasks, dependencies, milestones, templates,
automations, and workload capacity. Back up an existing database before
applying the script. Existing records are kept together in a shared default
workspace; users can create additional workspaces and invite existing accounts
by username. Workspace roles are owner, admin, editor, and viewer.

New accounts are added to the existing shared default workspace to preserve
the current collaboration behavior. Additional workspaces are isolated by
membership and the active workspace selection. Email digest preferences are
stored, but sending email requires a separately configured mail service.
Calendar export downloads an `.ics` snapshot for import into calendar clients;
it does not provide a live subscription or two-way synchronization.

## Data portability

Task export/import is available in Settings. Import expects the CSV format
produced by the app and creates new tasks only; it does not update or delete
existing tasks.
