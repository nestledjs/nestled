import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DEFAULT_PERMISSION_CATALOGS,
  DEFAULT_EMULATION_PERMISSION,
  readPermissionCatalogConfig,
  readEmulationPermissionConfig,
} from './doctor-permission-catalogs'

const writeConfig = (contents: string): string => {
  const file = join(mkdtempSync(join(tmpdir(), 'catalogs-')), 'doctor.config.json')
  writeFileSync(file, contents, 'utf8')
  return file
}

describe('readPermissionCatalogConfig', () => {
  it('returns the previously hard-coded values when no file exists', () => {
    // The whole fleet relies on this: eight repos ship no config and must see identical output.
    expect(readPermissionCatalogConfig(join(tmpdir(), 'absent-catalogs.json'))).toEqual({
      config: DEFAULT_PERMISSION_CATALOGS,
    })
    expect(DEFAULT_PERMISSION_CATALOGS.platform).toEqual({
      path: 'libs/api/prisma/src/lib/seed/seed-data/seed-platform-access-control.ts',
      export: 'platformPermissions',
      fields: ['key'],
    })
    expect(DEFAULT_PERMISSION_CATALOGS.organization).toEqual({
      path: 'libs/api/prisma/src/lib/seed/seed-data/seed-roles-permissions.ts',
      export: 'defaultPermissions',
      fields: ['subject', 'action'],
    })
  })

  it('takes a repo that seeds its own RBAC tables under a different shape', () => {
    // mi-core: predates PlatformAccessRole, seeds { name, resource, action } from an RBAC plugin.
    const file = writeConfig(
      JSON.stringify({
        selectFileSuffixes: ['.select.ts'],
        permissionCatalogs: {
          platform: {
            path: 'libs/api/custom/src/lib/plugins/rbac/seed-rbac.ts',
            export: 'permissions',
            fields: ['name'],
          },
        },
      }),
    )
    const reading = readPermissionCatalogConfig(file)

    expect(reading.invalid).toBeUndefined()
    expect(reading.config.platform).toEqual({
      path: 'libs/api/custom/src/lib/plugins/rbac/seed-rbac.ts',
      export: 'permissions',
      fields: ['name'],
    })
    // A scope the repo said nothing about keeps the default rather than becoming undefined.
    expect(reading.config.organization).toEqual(DEFAULT_PERMISSION_CATALOGS.organization)
  })

  it('keeps a valid scope when a different scope is malformed, and reports the rejection', () => {
    const file = writeConfig(
      JSON.stringify({
        permissionCatalogs: {
          platform: { path: 'libs/custom/catalog.ts', export: 'permissions', fields: ['name'] },
          organization: { path: '', fields: [] },
        },
      }),
    )
    const reading = readPermissionCatalogConfig(file)

    // Rejecting the whole file would return the correctly-configured scope to a default that reads
    // its catalog as empty -- the exact failure this config exists to prevent.
    expect(reading.config.platform.path).toBe('libs/custom/catalog.ts')
    expect(reading.config.organization).toEqual(DEFAULT_PERMISSION_CATALOGS.organization)
    expect(reading.invalid).toContain('organization.path')
    expect(reading.invalid).toContain('organization.fields')
  })

  it('falls back and says so for a file it cannot read as config', () => {
    expect(readPermissionCatalogConfig(writeConfig('{ "platform": '))).toEqual({
      config: DEFAULT_PERMISSION_CATALOGS,
      invalid: 'unparseable JSON',
    })
    expect(readPermissionCatalogConfig(writeConfig('[]'))).toEqual({
      config: DEFAULT_PERMISSION_CATALOGS,
      invalid: 'not a JSON object',
    })
    expect(
      readPermissionCatalogConfig(writeConfig('{ "permissionCatalogs": { "platform": "seed.ts" } }')).invalid,
    ).toContain('platform is not an object')
    // A config file that only sets other things must not be read as a catalog misconfiguration.
    expect(readPermissionCatalogConfig(writeConfig('{ "selectFileSuffixes": [".select.ts"] }'))).toEqual({
      config: DEFAULT_PERMISSION_CATALOGS,
    })
  })
})

describe('readEmulationPermissionConfig', () => {
  it('returns the previously hard-coded value when no file exists', () => {
    expect(readEmulationPermissionConfig(join(tmpdir(), 'absent-emulation.json'))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
    })
    expect(DEFAULT_EMULATION_PERMISSION).toBe('platform.users.emulate')
  })

  it('takes a repo whose emulation permission is scoped outside the platform catalog', () => {
    // mi-core: admin.emulate is deliberately tighter than GqlAuthAdminGuard's admin-namespace
    // check, but doesn't match the hard-coded default, so every emulation resolver reported as
    // unguarded regardless of enforcement. nestledjs/nestled#139's related-issue note.
    const file = writeConfig(JSON.stringify({ emulationPermission: 'admin.emulate' }))

    expect(readEmulationPermissionConfig(file)).toEqual({ permission: 'admin.emulate' })
  })

  it('trims a declared value, rather than validate it trimmed and return it padded', () => {
    // An untrimmed value passes the non-empty check but then never matches the un-padded
    // decorator text at the emulation-security call site -- a confusing false positive with no
    // error reported to explain it.
    const file = writeConfig(JSON.stringify({ emulationPermission: '  admin.emulate  ' }))

    expect(readEmulationPermissionConfig(file)).toEqual({ permission: 'admin.emulate' })
  })

  it('falls back and says so for a declared value that is not a non-empty string', () => {
    expect(readEmulationPermissionConfig(writeConfig(JSON.stringify({ emulationPermission: '' })))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
      invalid: 'emulationPermission is not a non-empty string',
    })
    expect(readEmulationPermissionConfig(writeConfig(JSON.stringify({ emulationPermission: 42 })))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
      invalid: 'emulationPermission is not a non-empty string',
    })
  })

  it('falls back and says so for a file it cannot read as config', () => {
    expect(readEmulationPermissionConfig(writeConfig('{ "emulationPermission": '))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
      invalid: 'unparseable JSON',
    })
    expect(readEmulationPermissionConfig(writeConfig('[]'))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
      invalid: 'not a JSON object',
    })
    // A config file that only sets other things must not be read as a misconfiguration.
    expect(readEmulationPermissionConfig(writeConfig('{ "selectFileSuffixes": [".select.ts"] }'))).toEqual({
      permission: DEFAULT_EMULATION_PERMISSION,
    })
  })
})
