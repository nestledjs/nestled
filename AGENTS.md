# NestledJS - Codex Instructions

## Repository Structure

This is an Nx workspace that publishes a **single package: `@nestledjs/generators`**
(at `generators/`) — an Nx plugin with six generators (four ongoing codegen/scaffolding
generators plus a one-time workspace bootstrap):

- `crud` — CRUD resolvers/services from Prisma models
- `custom` — creates or maintains the custom API library shell
- `model-extension` — explicitly scaffolds an additive resolver module for one Prisma model
- `sdk` — GraphQL client SDK (fragments, mutations, queries)
- `models` — GraphQL `@ObjectType` models and enums from Prisma models
- `workspace-setup` — one-time bootstrap of a freshly cloned workspace (rename the
  project, ensure `.env`/Docker, apply Prisma migrations, generate models, seed)

The shared engine (schema reading, `@skipCrud` filtering, the Nx library helpers) is
inlined under `generators/src/lib/engine/`.

There are no other publishable packages. The former
`@nestledjs/api|shared|utils|config|plugins|web|helpers` were consolidated into
`@nestledjs/generators@1.0.0` and deprecated on npm (see `README.md` → "Consolidation").
Their source remains in git history prior to the consolidation commit.

## Common Commands

```bash
nx build generators          # build the package
nx test generators           # run the vitest suite
nx lint generators           # lint
nx list @nestledjs/generators  # list the six generators
pnpm push generators         # build + push to the local yalc store (see README)
```

## Releases

Single-package Nx Release with independent versioning; the current version is resolved
from the **npm registry** (not git tags) to support rebase workflows (`nx.json` →
`release`). Tag pattern: `{projectName}@{version}` → `generators@x.y.z`.

```bash
# Full release (version + changelog + publish)
npx nx release --projects=generators

# Or step through explicitly
npx nx release version <patch|minor|major> --projects=generators
npx nx release publish --projects=generators

# Inspect / dry-run
npm view @nestledjs/generators version
npx nx release version patch --projects=generators --dry-run
```

Publishing to npm requires auth + (with 2FA) an OTP, which the user provides.

## Commit Conventions

Conventional commits: `<type>(<scope>): <description>`.

Types: `feat` (minor), `fix` (patch), `!` / `BREAKING CHANGE` (major), plus
`docs`, `style`, `refactor`, `test`, `chore` (no bump).

Scopes:

- `generators` — the package
- `nx` — Nx configuration
- `tools` — tooling/scripts

Examples:

```
feat(generators): add option to crud generator
fix(generators): correct enum import ordering in models output
chore(nx): update release configuration
```
