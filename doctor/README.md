# @nestledjs/doctor

Nestled's enforcement checks — the doctor and its verifiers — shipped as a package so every repo
runs provably identical rules.

Previously these were ~7,400 lines copied verbatim into every repo. A copy can be edited, and an
edited check reports clean while enforcing less; drift was only discoverable by hashing files
against the template. As a package, the version a repo runs is a line in its lockfile.

## Commands

| bin                              | replaces                                |
| -------------------------------- | --------------------------------------- |
| `nestled-doctor`                 | `tsx scripts/doctor.ts`                 |
| `nestled-verify-selects`         | `node tools/verify-selects.mjs`         |
| `nestled-verify-select-coverage` | `node tools/verify-select-coverage.mjs` |
| `nestled-verify-fragments`       | `tsx tools/verify-fragment-coverage.ts` |
| `nestled-verify-prisma-client`   | `tsx scripts/verify-prisma-client.ts`   |

All read the repo they are run in, from `process.cwd()`. Nothing about a repo is compiled in.

## What stays in the repo

The declarations, not the rules:

- `.nestled-updates/security/*.json` — guard baseline, public operations, permission exemptions,
  generated-crud posture
- `.nestled-updates/sdk-contract-*.json` — SDK contract baseline and exceptions
- `.nestled-updates/doctor.config.json` — repo layout, e.g. `selectFileSuffixes`,
  `permissionCatalogs` (where the repo declares its permissions, and the shape of an entry)

A repo declares **where to look** and **what it has been let off**. It does not get to change
**what the rules are** — that is the point of packaging them.

## Review declarations and guard updates

Doctor discovers tracked and untracked source using Git's ignore rules, including nested
`.gitignore` files. Tracked files remain checked even if a later rule ignores them. Source archives
without Git metadata use filesystem discovery with dependency/build directories excluded.

`resolver-scope` examines caller arguments used in data-access filters, not select/output field
names. Injection of `@CtxUser()` alone, or use solely as an audit actor, does not establish caller
scoping. An intentional cross-account query can declare its reviewed authorization in
`.nestled-updates/security/resolver-scope-exemptions.json`:

```json
{
  "libs/api/custom/src/lib/admin/admin.resolver.ts": {
    "listAccounts": "RequirePlatformPermission('platform.accounts.read') authorizes this cross-account query."
  }
}
```

Every exemption requires a non-empty reason; stale exemptions are reported. This is a static
heuristic, not proof that a service enforces authorization. Boolean permission probes that widen
row scope are not operation-level gates; assertions and predicates that reject access still need
a declarative access policy.

Audit coverage follows reachable local and typed sibling-service methods with cycle protection.
Strings and comments do not count. To recognize a durable event table without `audit` in its name,
add Prisma delegate names to `.nestled-updates/doctor.config.json` alongside the select suffixes:

```json
{
  "selectFileSuffixes": [".select.ts", ".projection.ts"],
  "auditModels": ["deletionRequest"]
}
```

Only `create`, `createMany`, and `createManyAndReturn` on declared delegates count as writes. For
structured audit logs or another deliberately different mechanism, use the existing per-mutation
`.nestled-updates/security/audit-exemptions.json` and explain the durable destination and retention.
Fragment verification uses exactly the configured `selectFileSuffixes`, as the select verifiers do.

Every handwritten API operation must appear in the committed guard baseline, including public
operations. After reviewing a specific operation's guards, update only its entry:

```sh
pnpm exec nestled-doctor --update-guard-baseline \
  --guard-operation 'libs/api/custom/src/lib/admin/admin.resolver.ts::listAccounts'
```

Repeat `--guard-operation` to select more entries. Selecting a removed operation deletes only that
entry. Unknown selections fail without writing the baseline. Omitting all selections retains the
full baseline refresh for initial adoption; review the whole diff before committing it.
