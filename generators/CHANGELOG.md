# Changelog — @nestledjs/generators

All notable changes to `@nestledjs/generators` are documented here. This project
uses independent semantic versioning; the current version is resolved from the npm
registry (see `nx.json` → `release`).

## 1.1.3

### Fixed

- **`models`: honor `@graphqlOmit` (security).** The `models` generator previously
  ignored `@graphqlOmit`, which the `sdk` and `crud` generators already respect. In
  code-first NestJS the emitted `@ObjectType()`/`@Field()` **is** the server GraphQL
  schema, so an omitted field still landed in `api-schema.graphql` and stayed
  queryable — the omit was only enforced in generated client operations, not on the
  server. Fields such as `encryptedAccessToken` / `encryptedRefreshToken` were fully
  queryable despite being marked `@graphqlOmit`. The generator now drops any field
  whose documentation includes `@graphqlOmit` (decorator and property), making
  `models.ts` the single authoritative enforcement point.

  **Migration:** regenerate models in each consumer (`nx g @nestledjs/generators:models`)
  and redeploy. **Audit:** any `@graphqlOmit` field was server-queryable in deployed
  clones until this upgrade — treat those as potentially exposed and rotate where the
  API was reachable.

- **`models`: import `JsonValue` from the project Prisma wrapper.** The generator
  hard-coded `import type { JsonValue } from '@prisma/client/runtime/client'`, bypassing
  the workspace's Prisma wrapper and risking the webpack resolution issues that wrapper
  exists to prevent. It now uses the resolved `prismaImportPath` (the same tsconfig
  alias already used for enum imports), so the import points at each project's own
  wrapper. Upgrade-only — regenerate models to pick up the corrected import.

## 1.1.2

### Fixed

- **`models`: emit `GraphQLJSON` instead of `GraphQLJSONObject` for `Json` fields.**
  `GraphQLJSONObject` throws `"JSONObject cannot represent non-object value"` when a
  `Json` column holds an array or scalar (e.g. `additionalLinks`,
  `additionalFiles`). `GraphQLJSON` is the safe superset (objects, arrays, and
  scalars) and matches what the `crud` generator already emits.

  **Migration:** after upgrading, regenerate and commit models in each consumer —
  `nx g @nestledjs/generators:models`. The diff should be only
  `GraphQLJSONObject → GraphQLJSON`. Array/scalar `Json` fields: this fixes a live
  runtime bug. Object-only `Json` fields: behavior-preserving.

## 1.1.1

### Fixed

- **`workspace-setup`: generate the Prisma client explicitly.** With a
  `prisma.config.ts`, `prisma db push` no longer auto-generates the client, so a
  fresh workspace's seed failed importing `libs/api/prisma/src/lib/prisma-generated`.
  The generator now runs `pnpm prisma:generate` between the database push and the
  type-generation/seed steps. Upgrade-only — no consumer action required.

## 1.1.0

### Added

- **New generator: `workspace-setup`.** A one-time bootstrap for a freshly cloned
  starter template:

  ```sh
  nx g @nestledjs/generators:workspace-setup --name=my-project
  ```

  It renames the project (`nestled-template` → `--name` across all files, skipping
  `.nestled/` and `.nestled-updates/`), ensures `.env`, validates a local
  `DATABASE_URL`, ensures Docker/Compose is up, applies Prisma migrations, generates
  GraphQL types, and seeds the database. This restores functionality that was
  dropped from the old `@nestledjs/api` package during the v1.0.0 consolidation.
  Adds `dotenv` and `pg` as runtime dependencies.

## 1.0.0

### Changed

- **Consolidation.** The former `@nestledjs/api | shared | utils | config | plugins |
  web | helpers` packages were collapsed into this single package containing the
  `crud`, `custom`, `sdk`, and `models` generators, with the shared engine inlined
  under `src/lib/engine/`. The old packages were deprecated on npm (not unpublished —
  existing installs keep working). See the repository `README.md` → "Consolidation".
