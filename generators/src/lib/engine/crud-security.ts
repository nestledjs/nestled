interface DocumentedModel {
  name: string
  documentation?: string | null
}

const LEGACY_CRUD_AUTH_PATTERN = /@crudAuth\b/

/**
 * Generator 3 deliberately has no model-level escape hatch for generated CRUD authorization.
 * Fail before writing output so a stale annotation cannot look accepted while being ignored.
 */
export function assertNoCrudAuthAnnotations(models: readonly DocumentedModel[]): void {
  const annotatedModels = models
    .filter((model) => LEGACY_CRUD_AUTH_PATTERN.test(model.documentation ?? ''))
    .map((model) => model.name)
    .sort((left, right) => left.localeCompare(right))

  if (annotatedModels.length === 0) return

  throw new Error(
    '@nestledjs/generators 3 no longer supports @crudAuth because generated CRUD is always ' +
      `admin-only. Remove @crudAuth from: ${annotatedModels.join(', ')}. ` +
      'Replace each lowered operation with an additive custom resolver that defines a ' +
      'purpose-built input and an explicit user- or tenant-scoped query. Scaffold one with ' +
      '`nx g @nestledjs/generators:model-extension <Model>`.',
  )
}
