# Pipeline Config — nestled

## Repo

| Field                   | Value                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo_name`             | `nestled`                                                                                                                                         |
| `framework`             | `nestled-library`                                                                                                                                 |
| `github_slug`           | `nestledjs/nestled`                                                                                                                               |
| `base_branch`           | `develop`                                                                                                                                         |
| `repo_path`             | resolve at runtime with `git rev-parse --show-toplevel` — portable across Mac (`~/IdeaProjects`) and Linux (`~/workspaces`) hosts; never hardcode |
| `flightdesk_project_id` | `92691b61-d070-4460-98f9-6c3b7ce1ee47`                                                                                                            |
| `sdk_command`           | `none`                                                                                                                                            |

## Agents

`agents/pipeline/` is the only agent folder in this repo and the only one Qalatra registers; its
`agent.config` runs FlightDesk turns. Do not add another `agent.config` under `agents/`. Plans
live on the FlightDesk task (`flightdesk plan submit`) — this repo has no `plans/` directory and
plan files are not committed.

## Deployment

| Field            | Value                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auto_merge`     | `true` — the adversarial verifier `MERGE` verdict is the approval; the pipeline merges + deploys directly with no human approval gate (dangerous mode) |
| `deploy_command` | `none` — library — merge only; npm release stays a manual human step                                                                                   |
| `merge_command`  | `gh pr merge <prNumber> --repo nestledjs/nestled --merge --delete-branch`                                                                              |

## Quality Gates

No SonarCloud on this repo — quality gates are the Intelligence Check plus canonical checks only.

## Source System

FlightDesk is the source of truth for task state and the only work ledger (D23); Linear is
retired (2026-10-03). This folder's agent reports only through FlightDesk: the FlightDesk turn
(`flightdesk turn end`) reports the outcome and FlightDesk advances the task.
