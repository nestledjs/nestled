import { CrudAuthConfig } from './generator-types'

/**
 * Every operation defaults to `admin`. A model with no `@crudAuth` annotation is fully
 * locked down, and a partial annotation only opens the operations it names.
 */
export const DEFAULT_CRUD_AUTH: Readonly<CrudAuthConfig> = Object.freeze({
  readOne: 'admin',
  readMany: 'admin',
  count: 'admin',
  create: 'admin',
  update: 'admin',
  delete: 'admin',
})

/** Matches the annotation and captures its JSON body. Not global, so it holds no lastIndex state. */
const CRUD_AUTH_PATTERN = /@crudAuth:\s*(\{.*})/

export function parseCrudAuth(comment: string): CrudAuthConfig | null {
  try {
    const match = CRUD_AUTH_PATTERN.exec(comment)
    if (!match) return null
    return JSON.parse(match[1])
  } catch (e) {
    console.error('Error parsing @crudAuth:', e)
    return null
  }
}

/**
 * Resolves a model's effective auth config: the admin defaults merged with whatever the
 * `@crudAuth` annotation specifies. Always returns a complete config — never undefined and
 * never partial.
 *
 * This is the single source of truth, shared by the CRUD generator and by
 * `getAllPrismaModels` in generator-utils. The two used to resolve auth differently: the CRUD
 * generator merged the defaults here, while getAllPrismaModels did
 * `auth: parseCrudAuth(doc) || undefined`. Because `JSON.stringify` drops undefined values,
 * an unannotated model lost its `auth` key entirely from the emitted database-models.ts, so
 * the two generated copies of that file disagreed — the api copy carried auth, the SDK copy
 * did not. Consumers reading the SDK copy to enforce per-model auth (the relation-traversal
 * compiler) saw `undefined` and had nothing to enforce against.
 *
 * Reading the annotation off `model.documentation` (rather than scanning raw schema text)
 * also keeps each model's config unambiguously its own.
 */
export function getCrudAuthForModel(model: { documentation?: string | null }): CrudAuthConfig {
  if (!model.documentation) return { ...DEFAULT_CRUD_AUTH }
  const config = parseCrudAuth(model.documentation)
  return config ? { ...DEFAULT_CRUD_AUTH, ...config } : { ...DEFAULT_CRUD_AUTH }
}
