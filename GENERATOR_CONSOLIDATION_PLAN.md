# Generator Consolidation Plan

**Goal:** Collapse the six generator packages into a single published `@nestledjs/generators`
package containing only the recurring Prisma-driven codegen, retire everything else, and move
the template's local `generate-models` script into it as a proper generator.

**End state:**

- One published Nx plugin: `@nestledjs/generators@3.0.0` with four generators:
  `crud`, `models`, `sdk`, `custom`.
- `@nestledjs/api`, `@nestledjs/shared`, `@nestledjs/utils`, `@nestledjs/config`,
  `@nestledjs/plugins`, `@nestledjs/web`, `@nestledjs/helpers` — deprecated on npm, archived in
  this repo.
- Downstream projects pin exactly one version and run one `db-update` chain.
- One-time scaffolding lives only in the starter template; future "guardrail" feature
  generators (new page, new plugin resolver, etc.) will be built locally in the template repo
  (separate effort, not this plan).

**Rationale (established in analysis, 2026-07-04):**

- The template consumes exactly three generators (`api:generate-crud`, `shared:sdk`,
  `api:custom`) plus a local `generate-models` script. Nothing in template runtime code imports
  any generator package; emitted templates carry no `@nestledjs` imports.
- `@nestledjs/utils` is the generators' private engine (918-line `generator-utils.ts`), not a
  user-facing utility lib. `@nestledjs/shared` is only "shared" in the sense that it generates
  `libs/shared/*`. `@nestledjs/helpers` has zero consumers anywhere.
- The local `generate-models` script has already drifted from the `api:core` template that
  produced it (Prisma v7 Decimal handling, client import path, enum import/export order — all
  fixed only in the template's copy, Feb 2026). Making it a published generator turns future
  fixes into version bumps instead of code-patch upgrade notes.

---

## Phase A — this repo (`nestled`)

### A1. Rebuild `generators/generators` as the real plugin

Transform the existing meta-package in place (keeps the npm name and repo project):

1. Delete the stub `src/lib/generators.ts` and the `@nestledjs/*` dependencies from
   `generators/generators/package.json`.
2. Create `generators/generators/generators.json` registering four generators:
   - `crud` — moved from `generators/api/src/generate-crud/` (impl + schema + files/ templates
     + the 379-line spec).
   - `custom` — moved from `generators/api/src/custom/` (+ spec).
   - `sdk` — moved from `generators/shared/src/sdk/` (impl + templates + spec). Keep the
     `forceCodegen` option as-is.
   - `models` — NEW, ported per A2 below.
3. Inline the engine: copy `generators/utils/src/lib/generator-utils.ts` (and its spec +
   `generator-utils.md` / `CLAUDE.md` docs) into `generators/generators/src/lib/engine/`.
   Update the four generators' imports from `@nestledjs/utils` → relative imports. Strip any
   engine exports only used by the retired scaffolding generators (do this by deleting and
   following compile errors, not by guessing).
4. Dependencies for the new package.json: `tslib`, `@nx/devkit`, `@prisma/internals`. No
   `@nestledjs/*` deps, no peerDependencies on internal packages.
5. Version: `3.0.0` (major above `@nestledjs/api@2.10.1` to signal it supersedes the CRUD
   engine's lineage; the old meta-package at 0.2.32 is unrelated in shape). Update
   description/keywords to reflect "Prisma-driven codegen for Nestled projects".

### A2. Port `generate-models` as the `models` generator

**Source of truth is the template's copy**, not the `api:core` template:
`/Users/justinhandley/IdeaProjects/nestled-dev-template/libs/api/core/models/src/lib/generate-models.ts`
(328 lines — it has the newest fixes). Port it as a pure Tree generator:

1. **Drop the `execSync('npx prisma generate ...')` step.** Prisma client generation stays a
   separate step in the consumer's `db-update` chain (`pnpm prisma:generate`). Generators must
   not shell out.
2. **Schema discovery:** replace the hand-rolled `prisma.config.ts` parsing with the engine's
   existing `getPrismaSchemaPath` / `readPrismaSchema` helpers (unify — don't keep two schema
   locators in one package). Verify the engine helpers handle multi-file schema dirs the way
   the script does (concatenate all `.prisma` files before `getDMMF`); if not, add that to the
   engine.
3. **Prisma wrapper import path:** the script hardcodes `@nestled-template/api/prisma`. Replace
   with resolution from the workspace's `tsconfig.base.json` path mappings (find the alias
   mapping to `libs/api/prisma/src/index.ts`), with a `prismaImportPath` schema option as
   explicit override. Fail loudly if neither resolves.
4. **Output path:** schema option `outputPath`, default `libs/api/core/models/src/lib/models`.
   Emits `models.ts`, `enums.ts`, `index.ts` exactly as the script does today.
5. **`@skipCrud` filtering:** keep the script's behavior (skip models AND strip relation fields
   pointing at skipped models). Check whether the engine's `getAllPrismaModels` already filters
   `@skipCrud`; consolidate into one implementation used by both `crud` and `models` so the two
   can never disagree about which models exist.
6. **Preserve the Feb-2026 fixes verbatim:** `JsonValue` import from
   `@prisma/client/runtime/client`, `Decimal` from `decimal.js` + `GraphQLDecimal` from
   `prisma-graphql-type-decimal`, `GraphQLBigInt` from `graphql-scalars`, conditional imports
   via `usesType()`, and the enum import-before-export ordering in `enums.ts`.
7. Write a spec: run against a fixture schema covering scalars, enums, Decimal/BigInt/Json/
   Bytes, relations, lists, and a `@skipCrud` model with relations pointing at it. Golden-file
   assert the three outputs.

### A3. Byte-compatibility gate (before publishing)

The acceptance test for A1+A2 is: **running the new generators against the template produces a
zero diff** (modulo the known-acceptable header/timestamp lines, if any).

1. `pnpm publish-all` / yalc-push the new `@nestledjs/generators` (update the yalc script's
   package order first — see A5).
2. In `nestled-dev-template`: `yalc add @nestledjs/generators`, temporarily point `db-update`
   at the new generator names, run it, and check `git diff` over `libs/api/generated-crud/`,
   `libs/shared/sdk/`, `libs/api/custom/src/index.ts`, `libs/api/custom/src/lib/default/index.ts`,
   and `libs/api/core/models/src/lib/models/`.
3. Any diff is a porting bug until proven otherwise. Do not publish to npm until the diff is
   clean and `pnpm run nestled-doctor`, `pnpm build:api`, `pnpm build:web` pass in the template.

### A4. Retire the old packages

After 3.0.0 is published to npm:

1. `npm deprecate` each of: `@nestledjs/api`, `@nestledjs/shared`, `@nestledjs/utils`,
   `@nestledjs/config`, `@nestledjs/plugins`, `@nestledjs/web`, `@nestledjs/helpers` with
   message: `"Consolidated into @nestledjs/generators@>=3 — see github.com/nestledjs/nestled"`.
   Do NOT unpublish (existing downstream lockfiles must keep resolving).
2. In this repo, move `generators/api`, `generators/shared`, `generators/utils`,
   `generators/config`, `generators/plugins`, `generators/web`, and `helpers/` out of the
   workspace (delete, or `archive/` directory excluded from `pnpm-workspace.yaml` and nx — git
   history preserves them either way; deleting is cleaner).
3. This removes the orphaned dead code for free (`generators/api/src/extended/`,
   `generators/shared/src/utils/` — implemented but never registered in any `generators.json`).
4. Before deleting, skim the retired feature-scaffolding generators (`api/src/plugin/`,
   `plugins/src/plugin/` auth templates, `plugins/src/integration/`, `api/src/smtp-mailer/`)
   and note anything worth mining later for the template-local guardrail generators. Reference
   only — their templates predate current template conventions and should not be copied as-is.

### A5. Repo housekeeping (do alongside A4)

- `scripts/yalc-publish.ts`: hardcoded publish order lists `forms`, which doesn't exist in this
  repo, and the six retired packages. Reduce to just `generators` (order no longer matters with
  one package).
- Root `package.json` has `"release": "ts-node ./scripts/release.ts"` but `scripts/release.ts`
  does not exist. Fix or remove; confirm `nx release` config in `nx.json`
  (`packageRoot: dist/{projectRoot}`) still covers the single package.
- Update root `README.md` / `AGENTS.md` / `GENERATOR_UPGRADE.md` to describe the single-package
  world and the four generators.

---

## Phase B — template repo (`nestled-dev-template`), after A3 passes

Executed back in the template session:

1. `package.json` dependency changes:
   - `@nestledjs/generators`: `^0.2.32` → `3.0.0` (exact pin — it drives committed codegen).
   - Delete the `pnpm.overrides` entries for `@nestledjs/api`, `@nestledjs/shared`,
     `@nestledjs/utils` (no longer installed at all).
   - `@nestledjs/forms`, `@nestledjs/forms-core` untouched (runtime libs, different concern).
2. Rewrite `db-update`:
   ```
   pnpm prisma:generate
     && nx g @nestledjs/generators:crud
     && nx g @nestledjs/generators:models
     && nx g @nestledjs/generators:sdk
     && nx g @nestledjs/generators:custom
   ```
   (Order preserved from today: crud → models → sdk → custom. `prisma:generate` is now explicit
   because the `models` generator no longer shells out to it.)
3. Delete `libs/api/core/models/src/lib/generate-models.ts` and the `generate:models` npm
   script (or alias `generate:models` → `nx g @nestledjs/generators:models` if anything else
   calls it — grep first). The generated output under `.../lib/models/` stays committed.
4. Run `pnpm db-update`; require zero diff. Then `pnpm run nestled-doctor`, `pnpm lint`,
   `pnpm test`, `pnpm build:api`, `pnpm build:web`, `pnpm format:check`.
5. Update docs that name the old generator invocations: `AGENTS.md` (Code Generation Workflow +
   db-update references), `README.md`, `docs/dev/README.md`, `docs/template/README.md`,
   `docs/dev/api-extension-methodology.md`, `docs/blueprints/README.md`,
   `docs/blueprints/extend-default-model.md`.
6. Check `scripts/doctor.ts` for any assumptions about the old package names (it checks
   `@nestledjs/`-prefixed publishable libs around line 822 — that's about `data-browser`/
   `shared-components` and should be unaffected, but verify).

## Phase C — downstream propagation

One upgrade note in the template repo (created during Phase B):

- `pnpm template:create-upgrade-note --id 2026-07-XX-consolidate-generators-v3`
- `priority: high`, `area: api`, `type: deps`, `delivery: code-patch`
- Intent: downstream swaps to `@nestledjs/generators@3.0.0`, removes the three
  `pnpm.overrides` pins, adopts the new `db-update` chain, deletes its local
  `generate-models.ts`, reruns `pnpm db-update`, and verifies zero unexpected diff +
  doctor/build. Note explicitly: if the downstream project locally patched its
  `generate-models.ts`, those patches are now upstream's responsibility — diff before deleting
  and report any local fix that v3 lacks as a nestled issue instead of keeping the fork.
- `affectedPaths`: `package.json`, `libs/api/core/models/**`, `libs/api/generated-crud/**`,
  `libs/shared/sdk/**`, `libs/api/custom/src/index.ts`, `libs/api/custom/src/lib/default/index.ts`
- `verification`: `pnpm db-update && pnpm run nestled-doctor && pnpm build:api`
- Run `pnpm template:validate-upgrade-notes`.

---

## Acceptance criteria

1. `@nestledjs/generators@3.0.0` published; four generators listed by
   `nx g @nestledjs/generators: --help` (or `nx list @nestledjs/generators`).
2. Template `db-update` on the new package produces **zero git diff** against currently
   committed generated code.
3. Template doctor, lint, tests, and both builds pass.
4. Old packages deprecated on npm, removed from the nestled workspace, yalc/release scripts
   updated.
5. Upgrade note created and validated in the template repo.

## Explicit non-goals

- No behavior changes to any generator output in this pass (byte-compat is the point; ship
  improvements as 3.1+).
- No template-local "guardrail" generators yet (new page / new plugin resolver / new
  integration) — separate follow-up in the template repo.
- No changes to `@nestledjs/forms`, `@nestledjs/forms-core`, `@nestledjs/data-browser`,
  `@nestledjs/shared-components`.
