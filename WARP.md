# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Nx workspace that publishes a **single package: `@nestledjs/generators`** — an
Nx plugin with four Prisma-driven generators used for ongoing development in NestledJS
starter templates:

- `crud` — CRUD resolvers/services from Prisma models
- `custom` — custom library wrappers for models
- `sdk` — GraphQL client SDK (fragments, mutations, queries)
- `models` — GraphQL `@ObjectType` models and enums from Prisma models

The package lives at `generators/`, with the shared engine inlined under
`generators/src/lib/engine/`. The former
`@nestledjs/api|shared|utils|config|plugins|web|helpers` packages were consolidated into
`@nestledjs/generators@1.0.0` and deprecated on npm (see `README.md`).

## Development Commands

```bash
# Build / test / lint the package
nx build generators
nx test generators
nx test generators --coverage
nx lint generators

# Affected-based (vs develop) and all-projects variants
pnpm build        # nx affected -t build --base=develop
pnpm build-all    # nx run-many -t build --all
pnpm test         # nx affected -t test --base=develop
pnpm lint         # nx affected -t lint --base=develop
```

### Local Development with YALC
```bash
# Build @nestledjs/generators and push to the local yalc store
pnpm push generators

# In the consumer project
yalc add @nestledjs/generators
pnpm install
```

### Release Management
```bash
pnpm release                                    # nx release
npx nx release --projects=generators            # version + changelog + publish
npx nx release version <bump> --projects=generators
```

## Architecture & Structure

- **`/generators/`** — the `@nestledjs/generators` package
  - `src/crud`, `src/custom`, `src/sdk`, `src/models` — the four generators (each with
    `generator.ts`, `schema.ts`, `schema.json`, `generator.spec.ts`, and `files/` templates
    where applicable)
  - `src/lib/engine/` — inlined shared engine (Prisma schema reading, `@skipCrud` filtering,
    Nx library/codegen helpers)
- **`/scripts/`** — repo maintenance scripts (`yalc-publish.ts`, `sync-release-tags.sh`)

### Key Dependencies
- **Nx 22.x** — workspace + build system, and the generator runtime (`@nx/devkit`, `@nx/js`, `@nx/nest`)
- **@prisma/internals** — DMMF parsing of the Prisma schema
- **Vitest** — test runner
- **TypeScript 5.x**

## Project-Specific Rules

- Package manager is **pnpm**; base branch for affected commands is **develop**.
- Generators are meant for external use (run inside a consuming workspace), not within this repo.
- Follow conventional commits; the only meaningful scope now is `generators` (plus `nx`, `tools`).
- Versions are resolved from the npm registry (see `nx.json` → `release`).
