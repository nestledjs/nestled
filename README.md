<!-- TODO: Add logo here -->
<!-- <p align="center"><img src="./assets/logo.png" alt="NestledJS" width="400" /></p> -->

# NestledJS

> If you are here because you want to rapidly deploy a site using NestledJS, please go to [nestledjs.com](https://nestledjs.com) and read the official docs.

**This README is for developers contributing to the NestledJS generator framework.**

## Overview

NestledJS has shifted from whole-site generation to **starter templates** paired with generators for ongoing development tasks. Rather than scaffolding an entire project from scratch, developers clone a starter template and use generators to keep their codebase in sync with their Prisma schema.

As of **v1.0.0**, all ongoing codegen ships in a **single published package: `@nestledjs/generators`**. See [Consolidation (v1.0.0)](#consolidation-v100) below if you're coming from the older multi-package setup (`@nestledjs/api`, `@nestledjs/shared`, `@nestledjs/utils`, …).

### The Generative API Philosophy

The core of NestledJS is `db-update` — a single command that regenerates your API layer from your Prisma schema:

```sh
pnpm db-update
```

This runs:

```json
"db-update": "pnpm prisma:generate && nx g @nestledjs/generators:crud && nx g @nestledjs/generators:models && nx g @nestledjs/generators:sdk && nx g @nestledjs/generators:custom"
```

1. **`prisma:generate`** — Generates the Prisma client from your schema
2. **`generators:crud`** — Generates CRUD resolvers and services from your Prisma models
3. **`generators:models`** — Generates GraphQL `@ObjectType` models and enums from your Prisma models
4. **`generators:sdk`** — Generates the GraphQL client SDK (fragments, mutations, queries)
5. **`generators:custom`** — Generates custom library wrappers for your models

Most one-time project scaffolding (the initial NestJS/web apps, library layout) lives in the starter templates themselves. The one exception is `workspace-setup`, the post-clone bootstrap (rename the project, `.env`/Docker, migrate, seed) — it ships in the package because it's run once right after cloning a template.

## Generators

`@nestledjs/generators` exposes five generators — four Prisma-driven codegen generators plus a one-time workspace bootstrap:

| Generator | Description |
|---|---|
| `@nestledjs/generators:crud` | Generate CRUD resolvers/services from Prisma models |
| `@nestledjs/generators:models` | Generate GraphQL `@ObjectType` models and enums from Prisma models |
| `@nestledjs/generators:sdk` | Generate the GraphQL client SDK (fragments, mutations, queries) |
| `@nestledjs/generators:custom` | Generate custom library wrappers for models |
| `@nestledjs/generators:workspace-setup` | One-time bootstrap of a freshly cloned workspace: rename the project, ensure `.env`/Docker, apply Prisma migrations, generate models, and seed |

List them any time with:

```sh
nx list @nestledjs/generators
```

See [`generators/CHANGELOG.md`](./generators/CHANGELOG.md) for release notes.

### Schema annotations

The codegen generators honor two annotations written as Prisma triple-slash (`///`) doc comments, so you control what reaches the generated GraphQL layer directly from `schema.prisma`:

| Annotation | Applies to | Effect |
|---|---|---|
| `@skipCrud` | model | Excludes the model from all generated output (`crud`, `sdk`, `models`) and strips inbound relation fields that point at it from other models. Use for types that must never appear in the GraphQL schema. |
| `@graphqlOmit` | field | Omits the field from the generated `@ObjectType` (`models`), client operations (`sdk`), and CRUD inputs (`crud`). Use for secrets/columns that must never be exposed through the API. |

```prisma
/// @skipCrud
model AuditLog {
  id   String @id
  data Json
}

model OAuthAccount {
  id                   String @id
  /// @graphqlOmit
  encryptedAccessToken String
}
```

> **Security (fixed in 1.1.3):** before `@nestledjs/generators@1.1.3` the `models` generator ignored `@graphqlOmit`, so annotated fields still received a `@Field()` and stayed queryable on the **server** GraphQL schema (the omit was only applied to generated client operations). Upgrade to ≥ 1.1.3, regenerate models, and redeploy — then audit and rotate any secret that was `@graphqlOmit`-annotated while reachable on a deployed clone.

### Access levels (`crud`)

Every generated CRUD operation declares its access level explicitly, resolved from the model's
`@crudAuth` annotation (all operations default to `admin` when unannotated):

| Level | Emitted |
|---|---|
| `admin` | `@AdminOnly()` + `@UseGuards(GqlAuthAdminGuard)` |
| `user` | `@Authenticated()` + `@UseGuards(GqlAuthGuard)` |
| `public` | `@Public()`, no guard |
| custom, e.g. `billingAdmin` | `@Authenticated()` + `@UseGuards(GqlAuthBillingAdminGuard)` |

A custom level's decorator declares only that a level exists — the custom guard remains
authoritative about what it means, so a `noaccess` guard still denies everyone. The decorators and
guards come from `@<scope>/api/utils`, and each generated file imports exactly what it uses.

> **⚠️ Upgrade ordering (1.1.6).** Generated output imports `AdminOnly`, `Authenticated`, and
> `Public` from `@<scope>/api/utils`. Those symbols only exist in a template that has taken the
> global-guard (`GlobalAuthGuard`) change. Apply that template upgrade **first**, then bump to
> ≥ 1.1.6 and regenerate. The reverse order produces generated code that does not compile, with an
> unresolved-import error that says nothing about ordering.

### Filtering (`crud`)

Each generated list query takes a typed `filters` input built from the model's own columns:

```graphql
query {
  users(input: { filters: { email: { contains: "@example.com" }, createdAt: { gte: "2026-01-01" } } }) {
    id
  }
}
```

Operators are chosen per scalar type — strings get `equals`/`in`/`contains`/`startsWith`/`endsWith`, numbers and dates get `equals`/`in`/`lt`/`lte`/`gt`/`gte`, booleans and enums get `equals`/`in`. List relations get `some`/`every`/`none` over the related model's filter input, and to-one relations nest that input directly. `@graphqlOmit` columns are absent from the filter inputs entirely, and `Json` columns and scalar lists are not filterable.

Every model's list input overrides `filters`, including models with no filterable column at all — those map to a shared `UnfilterableInput` placeholder. An explicit override is the only thing that removes an inherited field from a code-first schema, so a model left without one would keep exposing the untyped blob.

Relation nesting is bounded: each level emits its own set of input types (`UserFilterInput` → `PostFilterInput2` → `UserFilterInput3`), and the deepest level carries scalar fields only, which terminates the recursion. The default is 3 levels; pass `--filterDepth` to the `crud` generator to change it. `AND`/`OR`/`NOT` are deliberately not emitted, since they are self-referencing and would reintroduce unbounded nesting.

> **Security (fixed in 1.1.5):** before `@nestledjs/generators@1.1.5` generated list queries inherited an untyped `filters` blob (`GraphQLJSONObject`) that reached Prisma's `where` clause verbatim. GraphQL could not validate it, so a caller controlled the full Prisma filter grammar — and because `where` is built from the **database** model rather than the GraphQL model, every column was filterable whether or not it was queryable. `@graphqlOmit` gave no protection: an omitted credential column could be recovered a character at a time using the presence or absence of results as an oracle. Upgrade to ≥ 1.1.5, regenerate, and redeploy — then audit and rotate any secret held in a column that was reachable on a deployed clone, including password-reset and invite tokens.
>
> Upgrading is a **breaking schema change** for callers that passed raw `filters` JSON; see [`generators/CHANGELOG.md`](./generators/CHANGELOG.md) for the upgrade steps.

### Workspace bootstrap (`workspace-setup`)

Run **once, right after cloning a starter template** to turn a fresh clone into a running project:

```sh
nx g @nestledjs/generators:workspace-setup --name=my-project
```

`--name` must be lowercase-with-dashes (`^[a-z][a-z0-9-]*$`). In order, it: renames the project (`nestled-template` → your name across all files), ensures `.env`, validates that `DATABASE_URL` is local (refusing non-`localhost` DBs), ensures Docker/Compose is up, applies Prisma migrations, generates the Prisma client, generates GraphQL types, and seeds the database.

The rename deliberately **skips `.nestled/` and `.nestled-updates/`** so the Nestled upgrader and CI upgrade/doctor steps keep working. Requires Docker, a local `DATABASE_URL`, and the template's `prisma:apply` / `prisma:generate` / `generate:models` / `docker:*` scripts.

## Consolidation (v1.0.0)

Before v1.0.0, the framework published seven packages:
`@nestledjs/api`, `@nestledjs/shared`, `@nestledjs/utils`, `@nestledjs/config`,
`@nestledjs/plugins`, `@nestledjs/web`, and `@nestledjs/helpers`.

In practice, only three generators plus a local `generate-models` script were used for ongoing development; the rest were one-time scaffolding that belongs in the starter templates, private engine code (`@nestledjs/utils`), or unused. **v1.0.0 collapses everything into a single package, `@nestledjs/generators`, containing the five generators above** (`crud`, `custom`, `sdk`, `models`, `workspace-setup`) with the shared engine inlined.

**The seven old packages are deprecated on npm but not unpublished** — existing installs and lockfiles keep working. To migrate:

1. Depend on `@nestledjs/generators` (exact-pin it — it drives committed codegen) and remove any `@nestledjs/api|shared|utils` dependencies or `pnpm.overrides`.
2. Adopt the `db-update` chain shown above (note `prisma:generate` is now an explicit step — the `models` generator no longer shells out to Prisma).
3. Delete any local `generate-models.ts` script; `@nestledjs/generators:models` replaces it.
4. Run `pnpm db-update` and commit the regenerated output.

The source for the retired packages remains in this repository's git history prior to the v1.0.0 consolidation commit.

## Local Development with YALC

To test `@nestledjs/generators` in a local project, use [YALC](https://github.com/wclr/yalc) as a local package repository:

1. **Publish/push from this repo** (builds `@nestledjs/generators` and pushes to the yalc store):

    ```sh
    pnpm push generators
    ```

2. **In your consumer project, link the package:**

    ```sh
    yalc add @nestledjs/generators
    pnpm install
    ```

Re-run `pnpm push generators` after any change; `yalc push` propagates it to every linked consumer.

## Releasing

Releases use [Nx Release](https://nx.dev/features/manage-releases) with the config in `nx.json` (independent versioning, versions resolved from the npm registry):

```sh
nx release --projects=generators
```
