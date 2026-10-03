import { existsSync, readFileSync } from 'node:fs'

/**
 * The guard tier the CRUD generator emits on every generated resolver.
 *
 * `admin` is the correct state and the default. `authenticated` exists ONLY so a repo whose
 * application still reaches generated CRUD from non-superadmin surfaces can declare that fact
 * deliberately, with a reason and an exit condition, instead of either shipping a rollback nobody
 * can see or denying its own users. Declaring it is an incident, not a configuration preference.
 *
 * These mirror `@nestledjs/generators`' own constants. They are duplicated rather than imported
 * because the generator's reader takes an Nx `Tree` and its module pulls in @nx/devkit and
 * @prisma/internals — far too heavy for a doctor script. The spec asserts the two stay in step.
 */
export const GENERATED_CRUD_POSTURES = ['admin', 'authenticated'] as const

export type GeneratedCrudPosture = (typeof GENERATED_CRUD_POSTURES)[number]

export const GENERATED_CRUD_POSTURE_PATH = '.nestled-updates/security/generated-crud-posture.json'

export type GeneratedCrudPostureReading = {
  posture: GeneratedCrudPosture
  /** Why a declared value was rejected. Absent when the file is absent or the value is valid. */
  invalid?: string
  /** The repo's stated reason for a non-default posture, for reporting. */
  reason?: string
}

/**
 * Fail-closed in every direction: a missing file, unreadable file, unparseable JSON, a missing
 * `posture` key, a non-string, or an unrecognized value all resolve to `admin`. Only a positively
 * recognized posture relaxes anything — matching the generator, so the doctor can never assert a
 * weaker tier than the one actually emitted.
 */
export const readGeneratedCrudPosture = (
  postureFilePath: string = GENERATED_CRUD_POSTURE_PATH,
): GeneratedCrudPostureReading => {
  if (!existsSync(postureFilePath)) return { posture: 'admin' }

  let contents: string
  try {
    contents = readFileSync(postureFilePath, 'utf8')
  } catch {
    // Distinct from unparseable JSON on purpose: "fix the file or delete it" is the wrong advice
    // for a permissions or transient filesystem error, and the two need different responses.
    return { posture: 'admin', invalid: 'a file that exists but could not be read' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    return { posture: 'admin', invalid: 'unparseable JSON' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { posture: 'admin', invalid: 'not a JSON object' }
  }

  const declared = (parsed as { posture?: unknown }).posture
  const reason =
    typeof (parsed as { reason?: unknown }).reason === 'string'
      ? (parsed as { reason: string }).reason
      : undefined

  if (declared === undefined) return { posture: 'admin', invalid: 'no "posture" key', reason }
  if (typeof declared !== 'string') {
    return {
      posture: 'admin',
      invalid: `a non-string posture (${JSON.stringify(declared)})`,
      reason,
    }
  }
  if (!(GENERATED_CRUD_POSTURES as readonly string[]).includes(declared)) {
    return { posture: 'admin', invalid: `an unrecognized posture "${declared}"`, reason }
  }

  return { posture: declared as GeneratedCrudPosture, reason }
}
