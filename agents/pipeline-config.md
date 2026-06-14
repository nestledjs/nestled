# Pipeline Config — nestled

## Repo
| Field | Value |
|---|---|
| `repo_name` | `nestled` |
| `framework` | `nestled-library` |
| `github_slug` | `nestledjs/nestled` |
| `base_branch` | `develop` |
| `repo_path` | resolve at runtime with `git rev-parse --show-toplevel` — portable across Mac (`~/IdeaProjects`) and Linux (`~/workspaces`) hosts; never hardcode |
| `flightdesk_project_id` | `92691b61-d070-4460-98f9-6c3b7ce1ee47` |
| `sdk_command` | `none` |

## Deployment
| Field | Value |
|---|---|
| `auto_merge` | `true` — the adversarial verifier `MERGE` verdict is the approval — pipeline merges + deploys directly (`In Progress` → merge → `Done`), no `In Review` / human `Approved` gate (dangerous mode); see `linear-pipeline.md` → Merge Policy |
| `deploy_command` | `none` — library — merge only; npm release stays a manual human step |
| `merge_command` | `gh pr merge <prNumber> --repo nestledjs/nestled --merge --delete-branch` |

## Quality Gates
No SonarCloud on this repo — quality gates are the Intelligence Check plus canonical checks only.

## Source System — Linear (Pirate & Fox team)
| Field | Value |
|---|---|
| `source_system` | `linear` |
| Canonical lifecycle | `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/linear-pipeline.md` — state IDs, GraphQL patterns, turn-taking, identity |
| `linear_project_id` | `d6cf9cfc-c916-43c3-a76e-a91fae422e86` (Nestled) |
| API token | `~/.config/qalatra/secrets.md` → `SHI_LINEAR=` (authors as Shi) |
| FD task reference | the issue's `FlightDesk` attachment |

This pipeline only processes issues whose Linear project is `d6cf9cfc-c916-43c3-a76e-a91fae422e86`. Never mutate issues
routed to other repos.

## Closeout
Approved → merge (= deploy) → archive cloud session → archive FlightDesk task (webhook usually
handles it) → set Linear `Done` **last**, only after cleanup succeeds.
