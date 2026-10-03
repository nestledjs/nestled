# nestled — Planning Agent

Repo-specific values for the canonical planning workflow:

- **Repo name:** nestled
- **Repo path:** resolve at runtime with `git rev-parse --show-toplevel` (portable; use wherever the canonical references `{REPO_PATH}`)
- **Plans directory:** `<repo-root>/agents/plan/plans/` — save plans as `plans/YYYY-MM-DD-<slug>.md`

Fetch and follow:
1. `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/plan-agent.md` — canonical planning workflow

**Ignore `{EXECUTE_AGENT_PATH}` — not used.** FlightDesk dispatches execution once the plan is approved.

Key overrides (FlightDesk is the work ledger; Linear is retired):

- The task arrives as a FlightDesk `PLAN` dispatch (`$FLIGHTDESK_TASK_ID`, `$FLIGHTDESK_DISPATCH_ID`); where the prompt's `## Stage` section differs from this file, the Stage section governs.
- Commit the plan file, then submit it to the task: `flightdesk plan submit $FLIGHTDESK_TASK_ID --file <plan-file>` (MCP `submit_plan`). Humans review and approve it on the FlightDesk task.
- Need human input → `flightdesk questions ask` (MCP `ask_question`), one call per question, then end the turn. Never leave a question in prose only.
- **Never set the task status yourself** — end the turn with `flightdesk turn end --dispatch $FLIGHTDESK_DISPATCH_ID …` and FlightDesk advances it.
- Revision mode when the task description says "REVISION of already-deployed work": plan only the delta, new branch off current develop.
