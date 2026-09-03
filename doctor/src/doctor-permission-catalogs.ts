import { existsSync, readFileSync } from 'node:fs'

/**
 * Where a repo declares its permissions, and what an entry in that declaration looks like.
 *
 * The doctor validates every `@Require*Permission('...')` against the repo's own catalog, so it has
 * to be able to find and read that catalog. Hard-coding one seeding convention means any repo that
 * does not share it reads an empty catalog, and every permission it declares reports as unknown.
 * mi-core is the case in the fleet: it predates the template's PlatformAccessRole model and seeds
 * `{ name, resource, action }` from its own RBAC plugin, so it carried a local patch to doctor.ts
 * rather than run the packaged checks.
 *
 * Scope, so nobody re-derives it from the file's existence: on mi-core this is worth one finding
 * (the empty-catalog notice). Its large access-policy delta comes from the coverage rule its copied
 * doctor predates, which this config does not affect either way.
 *
 * The defaults are exactly what was hard-coded before this file existed, so a repo that says
 * nothing gets byte-identical output.
 */
export type PermissionCatalogSpec = {
  /** Repo-relative path to the source file declaring the catalog. */
  path: string
  /** The exported array-literal binding to read inside that file. */
  export: string
  /** Literal string properties of each entry, joined by `:` to form one permission. */
  fields: string[]
}

export type PermissionCatalogConfig = {
  platform: PermissionCatalogSpec
  organization: PermissionCatalogSpec
}

/** Repo layout lives in one file; a catalog's location is layout, not a separate concern. */
export const PERMISSION_CATALOGS_PATH = '.nestled-updates/doctor.config.json'

/** The key inside that file holding the catalog overrides. */
export const PERMISSION_CATALOGS_KEY = 'permissionCatalogs'

export const DEFAULT_PERMISSION_CATALOGS: PermissionCatalogConfig = {
  platform: {
    path: 'libs/api/prisma/src/lib/seed/seed-data/seed-platform-access-control.ts',
    export: 'platformPermissions',
    fields: ['key'],
  },
  organization: {
    path: 'libs/api/prisma/src/lib/seed/seed-data/seed-roles-permissions.ts',
    export: 'defaultPermissions',
    fields: ['subject', 'action'],
  },
}

export type PermissionCatalogReading = {
  config: PermissionCatalogConfig
  /** Why a declared value was rejected. Absent when the file is absent or every value is valid. */
  invalid?: string
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/**
 * Read one scope's override, falling back to the default for anything not positively valid.
 *
 * Rejecting the whole file over one bad key would take a repo that configured `platform` correctly
 * and silently return it to a default that reads its catalog as empty -- the exact failure this
 * config exists to prevent. Per-scope, per-field fallback keeps a partial config useful, and every
 * rejection is reported rather than absorbed.
 */
const readScope = (
  raw: unknown,
  fallback: PermissionCatalogSpec,
  scope: string,
  problems: string[],
): PermissionCatalogSpec => {
  if (raw === undefined) return fallback
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    problems.push(`${scope} is not an object`)
    return fallback
  }

  const declared = raw as Record<string, unknown>
  const path = isNonEmptyString(declared.path) ? declared.path : undefined
  const exported = isNonEmptyString(declared.export) ? declared.export : undefined
  const fields =
    Array.isArray(declared.fields) && declared.fields.length > 0 && declared.fields.every(isNonEmptyString)
      ? (declared.fields as string[])
      : undefined

  if (declared.path !== undefined && !path) problems.push(`${scope}.path is not a non-empty string`)
  if (declared.export !== undefined && !exported) problems.push(`${scope}.export is not a non-empty string`)
  if (declared.fields !== undefined && !fields) {
    problems.push(`${scope}.fields is not a non-empty array of non-empty strings`)
  }

  return {
    path: path ?? fallback.path,
    export: exported ?? fallback.export,
    fields: fields ?? fallback.fields,
  }
}

export const readPermissionCatalogConfig = (
  configPath: string = PERMISSION_CATALOGS_PATH,
): PermissionCatalogReading => {
  if (!existsSync(configPath)) return { config: DEFAULT_PERMISSION_CATALOGS }

  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { config: DEFAULT_PERMISSION_CATALOGS, invalid: 'unparseable JSON' }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { config: DEFAULT_PERMISSION_CATALOGS, invalid: 'not a JSON object' }
  }

  const root = parsed as Record<string, unknown>
  const section = root[PERMISSION_CATALOGS_KEY]
  // The file exists for other settings too (selectFileSuffixes), so saying nothing about catalogs
  // is the normal case, not a misconfiguration.
  if (section === undefined) return { config: DEFAULT_PERMISSION_CATALOGS }
  if (section === null || typeof section !== 'object' || Array.isArray(section)) {
    return {
      config: DEFAULT_PERMISSION_CATALOGS,
      invalid: `${PERMISSION_CATALOGS_KEY} is not an object`,
    }
  }

  const declared = section as Record<string, unknown>
  const problems: string[] = []
  const config: PermissionCatalogConfig = {
    platform: readScope(declared.platform, DEFAULT_PERMISSION_CATALOGS.platform, 'platform', problems),
    organization: readScope(declared.organization, DEFAULT_PERMISSION_CATALOGS.organization, 'organization', problems),
  }

  return problems.length > 0 ? { config, invalid: problems.join('; ') } : { config }
}

/** The key inside {@link PERMISSION_CATALOGS_PATH} naming the emulation-guard permission. */
export const EMULATION_PERMISSION_KEY = 'emulationPermission'

/**
 * The permission the `emulation-security` check accepts in place of `GqlAuthAdminGuard` on an
 * impersonation resolver, when a repo says nothing. This is the platform-catalog convention the
 * template ships, not a universal constant: a repo whose emulation permission is scoped
 * differently (mi-core's `admin.emulate`, seeded outside the platform catalog on purpose) needs
 * to declare it, or every impersonation resolver reports as unguarded regardless of its actual
 * enforcement.
 */
export const DEFAULT_EMULATION_PERMISSION = 'platform.users.emulate'

export type EmulationPermissionReading = {
  permission: string
  /** Why a declared value was rejected. Absent when the file is absent or the value is valid. */
  invalid?: string
}

/**
 * Read the repo's declared emulation permission from {@link PERMISSION_CATALOGS_PATH}, falling
 * back to {@link DEFAULT_EMULATION_PERMISSION}. Shares the file with `permissionCatalogs` and
 * `selectFileSuffixes`; saying nothing about this key is the normal case, not a misconfiguration.
 */
export const readEmulationPermissionConfig = (
  configPath: string = PERMISSION_CATALOGS_PATH,
): EmulationPermissionReading => {
  if (!existsSync(configPath)) return { permission: DEFAULT_EMULATION_PERMISSION }

  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { permission: DEFAULT_EMULATION_PERMISSION, invalid: 'unparseable JSON' }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { permission: DEFAULT_EMULATION_PERMISSION, invalid: 'not a JSON object' }
  }

  const declared = (parsed as Record<string, unknown>)[EMULATION_PERMISSION_KEY]
  if (declared === undefined) return { permission: DEFAULT_EMULATION_PERMISSION }
  if (!isNonEmptyString(declared)) {
    return {
      permission: DEFAULT_EMULATION_PERMISSION,
      invalid: `${EMULATION_PERMISSION_KEY} is not a non-empty string`,
    }
  }

  // Trimmed, not just validated as non-empty when trimmed: an untrimmed value passes this check
  // but then never matches the un-padded decorator text at the call site, which is a confusing
  // false positive with no error reported to explain it.
  return { permission: declared.trim() }
}
