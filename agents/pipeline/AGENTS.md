# Pipeline — nestled

Fetch and follow, in order:
1. `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/pipeline-agent.md` + `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/pipeline-architecture.md` — canonical stage handlers (session assessment, codegen, migration, checks, intelligence check)
2. `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/linear-pipeline.md` — Linear lifecycle, state IDs, GraphQL patterns ("Pipeline-Agent Source-System Overrides" section governs)

Repo-specific values: `../pipeline-config.md` — **read this first**.

## Discovery (overrides canonical Step 1)
Query Linear (GraphQL via curl, `SHI_LINEAR` token) for issues assigned to Shi in states
`In Progress`, `Changes Requested`, `Approved`, filtered to project `d6cf9cfc-c916-43c3-a76e-a91fae422e86` (Nestled).
The FlightDesk task is the issue's `FlightDesk` attachment. Qalatra is not used during monitoring.

## Per status
- **In Progress** → monitor FD/session (branch recovery per canonical), create the PR when the session is ready (merge develop in first if behind), attach `Preview` and `Pull Request` URLs to the issue, run quality gates (see config) → set `In Review`.
- **Changes Requested** → read the latest human comment(s), inject into the live session (re-dispatch on the existing branch if it died), comment back when pushed, set `In Review`. Never merge or re-plan here.
- **Approved** → merge per config (`merge_command`) — merging to develop IS the deploy — then archive session + FD task and set `Done` last. On failure: inbox alert, leave at `Approved` for retry.

Issue comments are the human-facing surface — concise, plain language.
