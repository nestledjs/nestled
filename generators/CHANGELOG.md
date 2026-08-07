# Changelog — @nestledjs/generators

All notable changes to `@nestledjs/generators` are documented here. This project
uses independent semantic versioning; the current version is resolved from the npm
registry (see `nx.json` → `release`).

## 3.0.3

### Fixed

- **`sdk`: stop scaffolding public copies of generated admin CRUD operations.** The SDK generator
  now recreates only `libs/shared/sdk/src/__admin/<model>` from the Prisma schema. Documents under
  `libs/shared/sdk/src/graphql` are application-owned and are never created or deleted based on
  Prisma models. This keeps the client surface aligned with the 3.0 admin-only generated CRUD
  boundary without disturbing purpose-built user-facing operations.

### Migration

Regenerate the SDK, then audit the preserved `libs/shared/sdk/src/graphql` tree. Delete legacy
per-model documents that call generated CRUD root fields (`create<Model>`, `update<Model>`,
`delete<Model>`, `<model>`, `<models>`, and `<models>Count`) and keep purpose-built documents for
explicit application resolvers. Do not create empty `.graphql` placeholders; organize real public
operations by feature or model and run `pnpm sdk` after adding them.

## 3.0.2

### Fixed

- **`crud`: compile relation-filter normalization with strict index-signature access.** Generated
  data access now uses bracket notation for keys on its generic filter map, so consumers with
  `noPropertyAccessFromIndexSignature` enabled no longer receive TS4111 errors after regeneration.

## 3.0.1

### Fixed

- **`crud`: restore bounded Prisma filter composition.** Typed model filters now emit
  `AND`/`OR`/`NOT`, with every logical operator pointing at the next generated depth instead of
  self-referencing. Logical composition and relation traversal therefore share the existing
  `filterDepth` budget, and the deepest input remains scalars-only. Scalar filters also expose
  `not`, and to-one relation filters expose `is`/`isNot` (including `is: null`) while preserving
  the direct nested shape generated since 1.1.5. Generated data access normalizes that compatibility
  shape into Prisma's relation-filter form; mixed direct and non-null `is` predicates are combined
  with `AND`, while the contradictory `is: null` plus direct-predicate shape fails before Prisma.
- **`crud`: compile legacy filter overrides with ES2022 class-field semantics.** Generated
  `List<Model>Input.filters` properties now have an explicit `undefined` initializer. This avoids
  TS2612 when a consumer regenerates before removing the old `filters` declaration from
  `CorePagingInput` and has `useDefineForClassFields` enabled. Consumers should still remove the
  opaque base field; changing their workspace-wide TypeScript setting is not required.

### Migration

Regenerate CRUD and the GraphQL SDK. Audit preserved application documents and runtime-built
variables that use `AND`/`OR`/`NOT`, scalar `not`, or relation `is`/`isNot`; generator 1.1.5 through
3.0.0 did not expose those fields, so TypeScript success alone did not prove that GraphQL would
accept them at runtime.

## 3.0.0

### Changed

- **Generated CRUD is always admin-only.** Every generated resolver now declares
  `@AdminOnly()` and `@UseGuards(GqlAuthAdminGuard)` at class level. Per-operation user, public,
  and custom guard generation has been removed.
- **The recursive selection compiler is private generated code.** It is now a non-exported helper
  inside `ApiCrudDataAccessService`; generated CRUD no longer imports `createSelect` from the
  consumer's core-helper barrel.
- **Per-model auth metadata has been removed.** Generated `database-models.ts` files no longer
  carry the obsolete `auth` object used by relation-traversal authorization.

### Removed

- **`@crudAuth` support.** The CRUD, SDK, models, and model-extension generators fail before
  writing output when any Prisma model still carries the annotation. The error lists every
  annotated model and points to the explicit-resolver migration.
- The programmatic `parseCrudAuth`, `getCrudAuthForModel`, `getGuardForAuthLevel`, and
  `getAccessLevelDecoratorForAuthLevel` exports.

### Migration

1. Inventory every `@crudAuth` operation before deleting annotations.
2. Replace lower-privilege operations with additive custom resolvers that use purpose-built inputs,
   authenticated user/tenant scope, and explicit Prisma `where`/`select` clauses. Use
   `nx g @nestledjs/generators:model-extension <Model>` when scaffolding is useful.
3. Keep generated inputs, filters, `ApiCrudDataAccessService`, and recursive selection compilation
   out of user-facing resolver libraries. Intentional generated-CRUD composition belongs in a
   separate admin-only library.
4. Remove the consumer's exported `createSelect`/viewer-context traversal machinery.
5. Upgrade to 3.0.0 and run the full `db-update` chain. Regenerate the runtime GraphQL schema and
   SDK, then verify every generated resolver is admin-only.

## 2.0.0

### Changed

- **`crud`: register generated resolvers through one canonical feature module.** The populated
  module is now written to `api-generated-crud-feature.module.ts`, imported into the API's
  `coreModules`, and exported from the generated feature barrel. The legacy
  `api-admin-crud-feature.module.ts` is deleted during generation. This removes the duplicate
  `ApiGeneratedCrudFeatureModule` class created by the old scaffold-plus-alternate-file flow.
- **`custom`: stop generating an inheriting resolver/service/module shell for every Prisma model.**
  Generated CRUD no longer depends on custom resolver inheritance for registration. The generator
  now maintains only the custom API library and its stable barrels, preserving every explicit
  extension already present.

### Added

- **New `model-extension` generator.** Run
  `nx g @nestledjs/generators:model-extension <Model>` to create an additive model-specific resolver
  module on demand. The conventional artifact name defaults to the Prisma model, while `--name`
  supports a more specific feature name without changing the target GraphQL type.

### Migration

This release changes resolver registration and therefore requires a coordinated consumer update:

1. Upgrade the template wiring so `ApiGeneratedCrudFeatureModule` is in `coreModules`.
2. Remove `extends Generated<Model>Resolver`, generated resolver imports, generated data-access
   constructor injection, and `super(...)` from custom resolvers.
3. Delete empty legacy default-model shells; preserve modules that contain real custom behavior.
4. Run `pnpm db-update`, then verify the GraphQL root fields and authorization guards.

Do not import the generated feature module while leaving inheriting custom resolvers registered:
Nest scans inherited resolver methods, so that temporarily registers duplicate callbacks for every
generated GraphQL field.

## 1.1.6

### Added

- **`crud`: emit an explicit access-level decorator on every generated operation.** The template
  registers a global `APP_GUARD` that refuses any operation which has not declared an access
  level. NestJS applies no guard unless one is asked for, so before that an operation missing
  `@UseGuards` was reachable anonymously, and a missing decorator was indistinguishable from an
  oversight. Hand-written resolvers declare themselves with `@Public()` / `@Authenticated()` /
  `@AdminOnly()`; generated ones could not, so the template carried an interim bridge that
  accepted an attached auth guard as a declaration — a loophole any hand-written resolver could
  lean on too. Generated operations now declare their own level, so that bridge can be deleted.

  Levels map as follows, from the resolved `@crudAuth` config:

  | Level                                       | Emitted                                                     |
  | ------------------------------------------- | ----------------------------------------------------------- |
  | `admin` (also the default when unannotated) | `@AdminOnly()` + `@UseGuards(GqlAuthAdminGuard)`            |
  | `user`                                      | `@Authenticated()` + `@UseGuards(GqlAuthGuard)`             |
  | `public`                                    | `@Public()`, no guard                                       |
  | custom, e.g. `billingAdmin`                 | `@Authenticated()` + `@UseGuards(GqlAuthBillingAdminGuard)` |

  A custom level's decorator declares only that a level exists; the custom guard stays
  authoritative about what it means, so a `noaccess` guard still denies everyone. No stricter
  level is inferred from the name.

  This also fixes an older reporting problem: `@crudAuth: { "readMany": "public" }` previously
  emitted **no decorator at all**, leaving a blank line where the guard would go — output
  byte-identical to a dropped decorator, a bad merge, or a generator bug. `public` is now
  positive and auditable, and absence is unambiguously a defect.

  Imports carry exactly the symbols used, so an all-admin model does not import `Public`, and an
  all-public model imports neither a guard nor `UseGuards`.

  **⚠️ Upgrade ordering — this is a hard dependency.** Generated output imports `AdminOnly`,
  `Authenticated`, and `Public` from `@<scope>/api/utils`. Those symbols exist only in a template
  that has taken the global-guard change. So: **first** apply the template upgrade note that adds
  the access-level decorators and `GlobalAuthGuard`, **then** bump to 1.1.6 and regenerate.
  Reversing the order produces generated code that does not compile, with an unresolved-import
  error that says nothing about ordering.

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
  Every model's list input carries the override — a model with no filterable column maps to
  a shared `UnfilterableInput` placeholder, since an explicit `@Field` override is the only
  mechanism that removes an inherited field from a code-first schema.
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

- **Consolidation.** The former
  `@nestledjs/api | shared | utils | config | plugins | web | helpers` packages were collapsed into
  this single package containing the
  `crud`, `custom`, `sdk`, and `models` generators, with the shared engine inlined
  under `src/lib/engine/`. The old packages were deprecated on npm (not unpublished —
  existing installs keep working). See the repository `README.md` → "Consolidation".
