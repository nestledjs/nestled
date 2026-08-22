# @nestledjs/doctor

Nestled's enforcement checks — the doctor and its verifiers — shipped as a package so every repo
runs provably identical rules.

Previously these were ~7,400 lines copied verbatim into every repo. A copy can be edited, and an
edited check reports clean while enforcing less; drift was only discoverable by hashing files
against the template. As a package, the version a repo runs is a line in its lockfile.

## Commands

| bin | replaces |
| --- | --- |
| `nestled-doctor` | `tsx scripts/doctor.ts` |
| `nestled-verify-selects` | `node tools/verify-selects.mjs` |
| `nestled-verify-select-coverage` | `node tools/verify-select-coverage.mjs` |
| `nestled-verify-fragments` | `tsx tools/verify-fragment-coverage.ts` |
| `nestled-verify-prisma-client` | `tsx scripts/verify-prisma-client.ts` |

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
