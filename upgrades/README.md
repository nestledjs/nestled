# @nestledjs/upgrades

`nestled-update` — apply Nestled template upgrades to a cloned project.

A project created from `nestled-template` uses this package to pull published
upgrades from its channel and apply them, tracking what it has already received
in `.nestled/upgrade-log.yaml`. Note **authoring** stays private (only the
template maintainer produces upgrades); every clone only ever consumes.

## Model

- **Manifest** — the published feed: an ordered list of releases plus a pointer
  per channel (`canary`, `stable`). A clone on channel `C` applies every release
  with `baseline < release.id <= channels[C]`. Canary points ahead of stable, so
  the maintainer's fleet validates a release before the world sees it.
- **Baseline** — each clone remembers the release it started from. Fresh clones
  read it from a committed `.nestled/template-version` stamp; `nestled-update
  init` records it, and each apply advances it.

See `docs/DISTRIBUTION-SPEC.md` in the nestled-upgrader repo for the full design.

## Delivery types

- **`code-patch`** — a `.diff` applied via `git apply`, falling back to `--3way`.
- **`package-release`** — bumps named packages in `package.json` and regenerates
  the lockfile locally; never diffs a lockfile.
- **`hybrid`** — both of the above.
- **`intent-only`** — no patch, no package bump. The change is a pattern to
  apply against the consumer's own content that no diff can carry, because
  every consumer's content differs (e.g. "annotate the calendar-day columns in
  your own `schema.prisma`"). `intent` explains why; a separate `review` field
  carries the reviewer-facing instructions for what to actually go do.

Any note — regardless of delivery type — may also carry `review`. It's
orthogonal to delivery: a `hybrid` note can bump a package, apply a patch, AND
still need a human judgment call the template author can't make on the
consumer's behalf. When `review` is present, `apply` still performs the
mechanical part (if any) and commits it, but:

- the note's outcome is recorded as `needs-review`, not `applied`
- the baseline is held **just below** the release containing that note, even
  though its mechanical part succeeded — advancing past it would make the
  review permanently unrecoverable, since a release below baseline is never
  re-offered by `check`/`apply` regardless of the note's own status
- later releases in the same channel are left pending rather than applied on
  top of unreviewed work
- `check` and `apply` keep re-surfacing the `review` text on every future run
  until it's resolved

Resolve it the same way a `blocked` note is resolved: do the reviewed work,
then hand-edit `.nestled/upgrade-log.yaml` to set that note's status to a
terminal outcome (`applied`, or `not-applicable` if it doesn't apply to this
project). The next `apply` picks up where it left off.

## CLI

```bash
nestled-update init      # establish this clone's baseline + channel
nestled-update check     # show pending upgrades (no changes)
nestled-update status    # show channel, baseline, applied history
nestled-update apply     # apply pending upgrades
```

## How it reads the feed

The feed lives in the public `nestled-template` repo under `.nestled-upgrades/`
(`manifest.yaml` + `patches/*.diff`). `nestled-update` adds the template as an
upstream remote, `git fetch`es the feed ref, and reads the manifest + patches
via `git show` — no working checkout of the template. For local development/
testing, `--manifest <file>` reads a manifest off disk instead.

Configure the feed once at init:

```bash
nestled-update init --remote <template-git-url> --ref develop --channel stable
```

## Status

- **Phase 1** — manifest schema, baseline stamp, channel-aware pending, and
  `init` / `check` / `status`.
- **Phase 2** — real `apply`: git-fetch feed transport, branch per run, 3-way
  patch application, `package-release` version bumps, verification gating with
  clean rollback on failure, baseline advancement, and optional `--pr`.

Still to come (producer side, in the private repo): the `publish` /
`promote-release` / `baseline-fleet` commands that write releases into the
template feed and move channel pointers.
