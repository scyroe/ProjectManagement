# Copilot Instructions — ProjectManagement

## Project Overview

This is a hobby Project Management web application built with:

- React 19
- TypeScript
- Rsbuild / Rspack
- TanStack Table
- ReUI
- Supabase
- Biome
- ES Modules (`"type": "module"`)

The project is intended to remain modern, maintainable, lightweight, and easy to extend.

---

## Core Development Principles

### 1. Work with the existing stack

Do not replace or introduce alternative frameworks/build tools without a specific reason.

Preferred technologies:

- React for UI
- TypeScript for application code
- Rsbuild/Rspack for bundling
- TanStack Table for complex table/data-grid behavior
- ReUI for UI/data-grid components
- Supabase for backend/database/auth functionality
- Biome for formatting and linting

Do not introduce Vite, Next.js, webpack configuration, or another frontend framework unless explicitly requested.

### 2. Prefer existing project dependencies

Before adding a dependency:

1. Check whether the existing project already provides the required functionality.
2. Prefer the existing stack and installed libraries.
3. Only add a dependency when it provides meaningful value.
4. Avoid introducing multiple libraries that solve the same problem.

Do not replace an existing library merely because another library is more familiar.

### 3. Make incremental changes

When modifying the application:

- Prefer small, focused changes.
- Do not rewrite unrelated code.
- Do not restructure directories unnecessarily.
- Preserve working functionality.
- Explain significant architectural changes before making them.

When fixing an error, address the root cause rather than masking the error.

---

# React

## Components

Prefer functional React components and modern React patterns.

Keep components focused on a single responsibility.

Avoid unnecessarily large components. When a component becomes difficult to understand, extract logical pieces into reusable components.

Prefer composition over excessive prop drilling or deeply coupled components.

Use React hooks appropriately and avoid unnecessary effects.

Do not use `useEffect` merely to derive values that can be calculated during rendering.

Prefer derived values with normal TypeScript/JavaScript when no side effect is required.

## State

Use the simplest appropriate state mechanism.

Prefer:

1. Local React state for local UI state.
2. Component composition for shared state where practical.
3. TanStack/Supabase mechanisms when the state is inherently related to those systems.

Do not introduce a global state library unless there is a clear project-level need.

---

# TypeScript

TypeScript is the default language for all new application code.

Do not create new `.js` or `.jsx` files unless explicitly requested.

Prefer precise types over `any`.

Avoid:

```ts
any
```

unless there is a documented and unavoidable reason.

Prefer:

- interfaces/types for domain models
- discriminated unions for state variants
- typed function parameters
- typed component props
- inferred types where inference is clear

Do not over-engineer types when simple inference is sufficient.

When working with Supabase data, use generated Supabase types whenever available rather than manually duplicating database types.

---

# Rsbuild / Rspack

Rsbuild is the project's build system.

Do not migrate the project to Vite or another bundler.

When changing build configuration:

- Prefer Rsbuild configuration APIs.
- Keep configuration minimal.
- Avoid unnecessary custom Rspack configuration.
- Preserve the existing development and production commands.

Before adding a build plugin, determine whether Rsbuild already supports the required behavior.

---

# TanStack Table

TanStack Table is the table/data-grid engine.

Use TanStack Table for:

- sorting
- filtering
- pagination
- column visibility
- column ordering
- column sizing
- row selection
- faceting
- expandable rows
- other table state/behavior

Do not implement custom table logic when TanStack Table already provides the required behavior.

Keep table behavior separate from presentation where practical:

- TanStack Table → state, models, sorting, filtering, etc.
- ReUI → presentation/UI
- Application components → domain-specific behavior

When working with the data grid, prefer the project's existing ReUI/TanStack integration rather than creating a second table abstraction.

---

# ReUI

ReUI is the preferred UI/data-grid component system for this project.

Prefer existing ReUI components before creating custom equivalents.

When implementing a UI feature:

1. Check whether ReUI already provides the component.
2. Reuse the existing component when appropriate.
3. Extend/customize it when necessary.
4. Only create a custom component when the existing solution is genuinely insufficient.

Do not blindly copy large ReUI examples into the project.

Adapt examples to:

- the project's TypeScript setup
- existing imports
- existing aliases
- current TanStack Table version
- existing component structure

Do not assume that an example from ReUI documentation exactly matches the installed package/version.

If an import such as:

```ts
@/components/reui/...
```

does not exist, inspect the actual project structure before inventing the path.

---

# Supabase

Supabase is the backend/database platform.

Use Supabase for:

- PostgreSQL data
- authentication
- authorization
- realtime functionality when needed
- storage when needed
- server-side/backend functionality supported by the project architecture

Follow Supabase/PostgreSQL best practices.

## Database

Prefer database constraints and PostgreSQL features over duplicating business rules exclusively in the frontend.

Use:

- foreign keys
- appropriate indexes
- `NOT NULL`
- appropriate data types
- unique constraints
- check constraints
- Row Level Security where appropriate

Avoid unnecessary queries.

Select only the columns required by a feature rather than retrieving entire tables when practical.

Consider query performance when designing data-heavy views such as the project data grid.

## Security

Never expose Supabase service-role credentials in browser code.

Never put secrets in:

```text
VITE_*
```

or equivalent client-exposed environment variables.

Only public/client-safe Supabase configuration should be available to browser code.

Respect Row Level Security.

Do not bypass RLS simply to make a frontend feature work.

If a feature requires elevated privileges, use an appropriate server-side mechanism rather than exposing privileged credentials.

---

# Environment Variables

Never hard-code:

- API keys
- service-role keys
- passwords
- tokens
- secrets
- database credentials

Use environment variables.

Do not commit `.env` files containing secrets.

When adding a new environment variable, update the appropriate example/environment documentation if the project uses one.

---

# File and Folder Structure

Follow the existing project structure.

Prefer feature-oriented organization when a feature becomes sufficiently complex.

Do not create excessive folders for small components.

Keep reusable UI components separate from domain-specific application components.

For example:

```text
src/
  components/
    ui/
    reui/
    MyComponents/
  features/
  lib/
  hooks/
  types/
```

Do not reorganize the entire project simply to satisfy a preferred folder convention.

---

# Imports

Use the project's configured path aliases where available.

Prefer:

```ts
@/...
```

over unnecessarily long relative imports when the alias is configured.

Before using an alias, verify that it is actually configured in the project.

Do not invent aliases.

Keep imports clean and let Biome organize them where applicable.

---

# Styling and UI

Prefer the project's existing styling/component system.

Do not introduce another CSS framework or component library without an explicit reason.

Prioritize:

- consistency
- accessibility
- responsive behavior
- keyboard navigation
- clear visual hierarchy
- reusable components

Avoid unnecessary visual complexity.

For data-heavy interfaces, prioritize usability and information density while maintaining good spacing and readability.

---

# Accessibility

Interactive UI must be accessible.

Prefer semantic HTML.

Buttons should be actual `<button>` elements.

Links should be actual links.

Form controls should have appropriate labels.

Interactive components should support keyboard navigation.

Do not rely exclusively on color to communicate state.

Use accessible names and ARIA attributes where required.

Prefer accessible ReUI components rather than recreating interaction behavior manually.

---

# Error Handling

Handle errors explicitly.

Do not silently swallow errors such as:

```ts
catch {
}
```

unless intentionally justified.

For Supabase operations, check and handle returned errors.

User-facing errors should be understandable.

Developer-facing errors should contain enough information to diagnose the problem.

Avoid exposing sensitive backend information to users.

---

# Data Fetching

Keep data fetching close to the feature that uses it unless there is a clear reason to centralize it.

Avoid duplicate requests.

When fetching Supabase data:

- select only required fields
- handle loading states
- handle error states
- handle empty states
- use appropriate indexes for frequently queried data
- consider pagination for large datasets

Do not fetch an entire table into the browser simply because the current dataset is small.

Design the feature so it can scale reasonably.

---

# Forms and Validation

Validate data at the appropriate boundaries.

Client-side validation improves UX but must not be treated as the only security boundary.

Important business rules should also be enforced by the database/backend.

Prefer strongly typed form data.

Avoid duplicating validation logic unnecessarily between multiple layers.

---

# Biome

Biome is the project's formatter/linter.

Prefer the project's existing Biome configuration.

Before considering a task complete, run the appropriate checks, for example:

```bash
pnpm check
```

Do not introduce ESLint or Prettier unless explicitly requested.

Do not manually fight Biome's formatting rules.

---

# Package Management

Use `pnpm`.

Prefer:

```bash
pnpm install
pnpm add <package>
pnpm add -D <package>
pnpm remove <package>
```

Do not use npm or yarn for project dependency management unless explicitly required.

Do not modify lockfiles manually.

Avoid unnecessary dependency upgrades.

When adding a dependency, consider whether it is compatible with the existing React, Rsbuild, TypeScript, TanStack, and ReUI versions.

---

# Verification

After making code changes:

1. Check TypeScript errors.
2. Run Biome checks.
3. Run the relevant build/test command when appropriate.
4. Verify imports and paths.
5. Check that existing functionality was not unnecessarily affected.

For changes involving:

- Supabase → verify queries/types/security assumptions.
- TanStack Table → verify sorting/filtering/pagination/state behavior.
- ReUI → verify component imports against the installed project.
- Rsbuild → verify the development and production build.
- TypeScript → verify there are no new type errors.

Do not claim a change works unless it has been reasonably verified.

---

# Working With Documentation and Skills

Installed Copilot skills provide detailed knowledge for technologies such as Supabase/PostgreSQL and other project dependencies.

Use those skills when relevant instead of duplicating large sections of external documentation in this file.

These instructions define **project-specific conventions**.

When project instructions and generic examples conflict, follow the actual project configuration and installed package versions.

Before implementing an unfamiliar API:

1. Inspect the installed package/version.
2. Check the project's existing usage.
3. Consult the relevant skill/documentation when available.
4. Implement using the API actually available in the project.

Do not assume that code copied from an online example is compatible with the installed version.

---

# Existing Code Takes Priority

When modifying existing code:

- Preserve established patterns when they are reasonable.
- Avoid unnecessary rewrites.
- Do not replace working implementations simply because another approach is preferred.
- Match the surrounding code's conventions.
- Improve architecture incrementally.

If existing code appears incorrect or outdated, explain the relevant issue and make the smallest safe improvement.

---

# Before Adding New Architecture

Before introducing:

- a state management library
- a data-fetching library
- a UI component library
- a new table/grid implementation
- a new form library
- a new build tool
- a new backend abstraction

first check whether the existing stack already solves the problem.

The goal is a coherent application rather than a collection of overlapping libraries.

---

# AI Coding Behavior

When asked to implement a feature:

1. Inspect the relevant existing files first.
2. Understand the current architecture.
3. Reuse existing components/utilities.
4. Make the smallest appropriate change.
5. Keep TypeScript types accurate.
6. Follow the project's existing conventions.
7. Verify the result.

Do not create placeholder implementations when the actual project structure can be inspected.

Do not invent files, components, APIs, package names, or ReUI paths.

If an assumption is necessary, state it clearly.

For multi-step changes, implement incrementally rather than generating a large unrelated rewrite.

The final implementation should feel like it was written as part of this project, not copied from a generic tutorial.