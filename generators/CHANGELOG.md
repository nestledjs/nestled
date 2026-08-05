# Changelog — @nestledjs/generators

All notable changes to `@nestledjs/generators` are documented here. This project
uses independent semantic versioning; the current version is resolved from the npm
registry (see `nx.json` → `release`).

## 1.1.5

### Fixed

- **`crud`: replace the opaque `filters` blob with typed filter inputs (security).**
  Generated list queries inherited an untyped `filters` field (`GraphQLJSONObject`) from
  the template's `CorePagingInput`, and consuming template code merged it straight into
  Prisma's `where` clause. Three properties combined into an anonymously exploitable
  read primitive: the blob was opaque, so GraphQL could not validate it; it reached
  `where` verbatim, so a caller controlled the full Prisma filter grammar
  (`AND`/`OR`/`NOT`, `contains`/`startsWith`/`gt`/`in`, and relation filters at
  arbitrary depth); and Prisma's `where` is built from the **database** model rather than
  the GraphQL model, so every column was filterable whether or not it was queryable.

  That last point meant `@graphqlOmit` offered no protection here. Credential columns
  removed from the GraphQL layer stayed filterable, and result presence acts as an
  oracle — roughly 60 requests per character — so password-reset and invite tokens could
  be recovered and used for account takeover with no cracking step.

  Each model now gets a typed `<Model>FilterInput` containing only its filterable
  columns, with operator sub-inputs chosen per scalar type. It is built from the same
  field list the CRUD generator already filters with `@graphqlOmit`, so an omitted column
  is unfilterable by construction rather than by a second list that could drift. `Json`
  columns and scalar lists are not filterable, and `AND`/`OR`/`NOT` are not emitted.
  Relation nesting is bounded by generating a distinct type per level (default 3,
  configurable with `--filterDepth`); the deepest level carries scalars only, which
  terminates the recursion.

  **Migration:** regenerate CRUD in each consumer
  (`nx g @nestledjs/generators:crud`) and redeploy. This is a **breaking schema change**
  for any caller that passed raw `filters` JSON — which is the vulnerability, so the
  break is intended:

  - Generated `__admin` SDK operations are deleted and rebuilt on every run, so they
    pick up the new schema automatically.
  - Public SDK operations under `libs/shared/sdk/src/graphql/<model>` are **preserved**
    across runs to protect hand edits. Any that pass raw `filters` JSON keep their old
    shape, so `pnpm sdk` (graphql-codegen) will **fail** validation against the new
    schema. That failure is correct and expected: hand-edit those operations to the
    typed shape, along with any codegen'd hook or component built on them.
  - The admin data browser needs no changes — the operators it emits (`gte`/`lte` ranges,
    equality, `in`, relation filters) are all covered.

  **Audit:** any column present in the database was filterable through this blob in
  deployed clones, including `@graphqlOmit` columns. Treat secrets held in those columns
  as potentially exposed where the API was reachable, and rotate — password-reset tokens
  and invite tokens in particular.

- **`sdk`: carry per-model `auth` into the SDK copy of `database-models.ts`.** Two
  generated copies of `database-models.ts` are produced by two different model loaders.
  The `crud` copy resolved `@crudAuth` through a resolver that merges the admin defaults
  and always returns a complete config; the `sdk` copy did
  `auth: parseCrudAuth(doc) || undefined`, and because `JSON.stringify` drops undefined
  values, the `auth` key vanished entirely from the emitted file for any model without an
  annotation. Consumers that enforce per-model auth while compiling relation traversals
  import the **SDK** copy, so they had nothing to enforce against. Both loaders now share
  one resolver (`lib/engine/crud-auth.ts`), so every model in both copies carries a
  complete `auth` object — defaults merged, so a partial annotation like
  `{ "readMany": "user" }` still emits `admin` for the other five operations.

  **Migration:** regenerate the SDK (`nx g @nestledjs/generators:sdk`) and commit the
  updated `libs/shared/sdk/src/lib/database-models.ts`.

## 1.1.4

### Fixed

- **`crud`: resolve `@crudAuth` from the DMMF model instead of scanning schema text.**
  The lookup searched for a line starting with `model <Name>` with no word boundary, so
  resolving `User` also matched `model UserSessionProgress`, `model UserAddress`, or any
  other model whose name merely starts with those characters. It took the first match, so
  a model that should have defaulted to `admin` could silently inherit a neighbour's
  `user` or `public` level. Multi-file schema directories made this easy to hit, since
  the files are concatenated alphabetically and the hijacking model only has to sort
  earlier. Prisma already associates each `///` doc comment with its own model, so the
  annotation is now read from `model.documentation`.

  **Audit:** check generated resolvers for models whose name is a prefix of another
  model's — they may have been generated with a weaker guard than intended.

- **`crud`: preserve custom `@crudAuth` level casing when building guard names.** The
  level was fully lowercased before building the guard symbol, so a custom level like
  `billingAdmin` produced `GqlAuthBillingadminGuard` — a symbol that does not exist —
  and consumers had to alias their real guard to the mangled name to make generated code
  compile. Only the first character is normalised now, so `billingAdmin` resolves to
  `GqlAuthBillingAdminGuard`.

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
