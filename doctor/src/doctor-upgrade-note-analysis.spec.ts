import { describe, expect, it } from 'vitest'
import { isSensitiveTemplatePath } from './doctor-upgrade-note-analysis'

const SCHEMA = 'libs/api/prisma/src/lib/schemas/schema.prisma'
const sensitive = (path: string) => isSensitiveTemplatePath(path, SCHEMA)

describe('isSensitiveTemplatePath', () => {
  it('covers runtime behaviour downstream inherits', () => {
    expect(sensitive('libs/api/core/src/lib/thing.ts')).toBe(true)
    expect(sensitive('libs/api/custom/src/lib/default/user/user.resolver.ts')).toBe(true)
    expect(sensitive('apps/api/src/app.module.ts')).toBe(true)
    expect(sensitive('apps/web/app/routes/admin/_index.tsx')).toBe(true)
    expect(sensitive('apps/web/app/routes.tsx')).toBe(true)
    expect(sensitive(SCHEMA)).toBe(true)
    expect(sensitive('libs/api/utils/src/lib/guards/gql-auth.guard.ts')).toBe(true)
  })

  it('covers build and workflow tooling', () => {
    // A downstream project runs `pnpm db-update` and follows AGENTS.md, but receives neither
    // through a dependency bump — both arrive only by being copied. Before this, a change to
    // either passed the gate silently because nothing under libs/api had moved, which is how
    // the db-update pipeline rewrite landed without a note.
    expect(sensitive('scripts/db-update.mjs')).toBe(true)
    expect(sensitive('scripts/test-db.sh')).toBe(true)
    expect(sensitive('AGENTS.md')).toBe(true)
  })

  it('leaves root package.json alone', () => {
    // It churns for reasons downstream does not care about, and a tooling change worth a note
    // moves a script or the documented workflow alongside it, so it is caught anyway.
    expect(sensitive('package.json')).toBe(false)
    expect(sensitive('pnpm-lock.yaml')).toBe(false)
  })

  it('leaves nested AGENTS.md and ordinary docs alone', () => {
    // Directory-local contributor guidance. One sitting under a path that matters is already
    // matched by that path's own rule.
    expect(sensitive('libs/web-ui/AGENTS.md')).toBe(false)
    expect(sensitive('docs/dev/dev-ports.md')).toBe(false)
    expect(sensitive('README.md')).toBe(false)
    expect(sensitive('libs/api/custom/AGENTS.md')).toBe(true)
  })

  it('does not match unrelated paths', () => {
    expect(sensitive('libs/web-ui/src/lib/web-ui-button.tsx')).toBe(false)
    expect(sensitive('libs/shared/utils/src/lib/date.ts')).toBe(false)
    expect(sensitive('apps/web/app/components/ui/table.tsx')).toBe(false)
  })
})
