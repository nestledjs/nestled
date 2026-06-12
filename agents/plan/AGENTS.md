# nestled — Planning Agent

Repo-specific values for the canonical planning workflow:

- **Repo name:** nestled
- **Repo path:** resolve at runtime with `git rev-parse --show-toplevel` (portable; use wherever the canonical references `{REPO_PATH}`)
- **Plans directory:** `<repo-root>/agents/plan/plans/` — save plans as `plans/YYYY-MM-DD-<slug>.md`

Fetch and follow, in order:
1. `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/plan-agent.md` — canonical planning workflow
2. `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/linear-pipeline.md` — Linear source-system overrides (the "Planner Source-System Overrides" section governs)

**Ignore `{EXECUTE_AGENT_PATH}` — not used.** Execution kickoff is the orchestrator's job after the plan completes.

Key overrides (full detail in linear-pipeline.md):
- Post the finished plan as **one Linear comment** on the issue; complete the Qalatra task with the plan file path in `links`.
- Need human input → ask in a Linear comment, leave the issue at `Planning`, leave the Qalatra task active. A Shi-authored last comment means "waiting on human."
- **Never change the Linear status** — the orchestrator advances it (and respects the `plan-gate` label).
- Revision mode when the task description says "REVISION of already-deployed work": plan only the delta, new branch off current develop.
