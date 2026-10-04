import { existsSync, readFileSync } from 'node:fs'

/**
 * A repo's declaration of its own guards, and what each one means.
 *
 * Doctor recognizes a fixed vocabulary of authorization: the `Require*Permission` decorators,
 * caller scoping, and the template's own guards. A repo whose operations are gated by a guard it
 * wrote itself — "super admins, or anyone holding `billing:manage` through any organization role" —
 * had no way to say so. The only escapes were one written exemption per operation, all repeating
 * the same sentence (forty identical excuses read exactly like a bulk baseline on review, which is
 * what the exemption file exists to prevent), or a generated-CRUD posture that misstates the guard.
 *
 * One typed statement per guard replaces those:
 *
 *   {
 *     "GqlAuthBillingAdminGuard": {
 *       "authLevel": "authenticated",
 *       "grants": ["billing:manage"],
 *       "superAdminBypass": true,
 *       "reason": "Billing staff operate the billing system; super-admin-only would deny its users."
 *     }
 *   }
 *
 * - `access-policy` treats an operation behind a declared guard as authorized, the way a
 *   `Require*Permission` decorator is.
 *
 * The declaration is a claim the doctor cannot verify by reading the guard's body, which is why each
 * entry owes a reason and why an entry no operation uses is reported: an unused declaration is a
 * claim nobody checks.
 */
export const DECLARED_GUARDS_PATH = '.nestled-updates/security/declared-guards.json'

/**
 * The access levels a declared guard can stand for. `public` is not one: a guard declared here is an
 * authorization claim about an identified caller, and a public operation has none — those belong in
 * the public-operations allowlist.
 */
export const DECLARED_GUARD_AUTH_LEVELS = ['authenticated', 'admin'] as const

export type DeclaredGuardAuthLevel = (typeof DECLARED_GUARD_AUTH_LEVELS)[number]

export type DeclaredGuard = {
  name: string
  authLevel: DeclaredGuardAuthLevel
  grants: string[]
  superAdminBypass: boolean
  reason: string
}

export type DeclaredGuards = ReadonlyMap<string, DeclaredGuard>

export type DeclaredGuardsReading = {
  /** Only entries that validated. An invalid entry recognizes nothing — fail closed. */
  guards: DeclaredGuards
  /** One message per rejected entry or file-level defect, for reporting. */
  problems: string[]
}

// The same shape the guard checks read as a guard: doctor only ever sees guards by this name, so a
// key that does not match it could never be found on an operation.
const guardNamePattern = /^[A-Z]\w*Guard$/

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateEntry = (name: string, entry: unknown): { guard?: DeclaredGuard; problem?: string } => {
  if (!guardNamePattern.test(name)) {
    return { problem: `"${name}" is not a guard name (expected PascalCase ending in "Guard")` }
  }
  if (!isPlainObject(entry)) return { problem: `"${name}" must be an object` }

  const { authLevel, grants, superAdminBypass, reason } = entry
  if (typeof reason !== 'string' || reason.trim() === '') {
    return { problem: `"${name}" has no "reason"; say why this guard is the right authorization` }
  }
  if (typeof authLevel !== 'string' || !(DECLARED_GUARD_AUTH_LEVELS as readonly string[]).includes(authLevel)) {
    return {
      problem: `"${name}" declares authLevel ${JSON.stringify(
        authLevel,
      )}; expected one of ${DECLARED_GUARD_AUTH_LEVELS.join(', ')}`,
    }
  }
  if (
    !Array.isArray(grants) ||
    grants.length === 0 ||
    !grants.every((grant) => typeof grant === 'string' && grant.trim() !== '')
  ) {
    return { problem: `"${name}" must list what it admits in "grants", as a non-empty array of strings` }
  }
  if (superAdminBypass !== undefined && typeof superAdminBypass !== 'boolean') {
    return { problem: `"${name}" declares a non-boolean "superAdminBypass"` }
  }

  return {
    guard: {
      name,
      authLevel: authLevel as DeclaredGuardAuthLevel,
      grants: grants as string[],
      superAdminBypass: superAdminBypass === true,
      reason,
    },
  }
}

export const parseDeclaredGuards = (contents: string): DeclaredGuardsReading => {
  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    return { guards: new Map(), problems: ['the file is not valid JSON'] }
  }
  if (!isPlainObject(parsed)) {
    return { guards: new Map(), problems: ['the file must be a JSON object keyed by guard name'] }
  }

  const guards = new Map<string, DeclaredGuard>()
  const problems: string[] = []
  for (const [name, entry] of Object.entries(parsed)) {
    const { guard, problem } = validateEntry(name, entry)
    if (guard) guards.set(name, guard)
    if (problem) problems.push(problem)
  }

  return { guards, problems }
}

/** A missing file declares nothing and is not a problem; an unreadable one is. */
export const readDeclaredGuards = (path: string = DECLARED_GUARDS_PATH): DeclaredGuardsReading => {
  if (!existsSync(path)) return { guards: new Map(), problems: [] }
  let contents: string
  try {
    contents = readFileSync(path, 'utf8')
  } catch {
    return { guards: new Map(), problems: ['the file exists but could not be read'] }
  }
  return parseDeclaredGuards(contents)
}

/** The declared guards among an operation's guards. */
export const declaredGuardsOn = (guardNames: readonly string[], declared: DeclaredGuards): string[] =>
  guardNames.filter((guard) => declared.has(guard))

/** Declared guards that no operation carries, sorted for stable reporting. */
export const unusedDeclaredGuards = (declared: DeclaredGuards, used: ReadonlySet<string>): string[] =>
  [...declared.keys()].filter((name) => !used.has(name)).sort((left, right) => left.localeCompare(right))
