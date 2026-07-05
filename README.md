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
