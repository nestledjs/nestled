# @nestledjs/generators

Nx generators for keeping a Nestled workspace aligned with its Prisma schema and for scaffolding
explicit API extensions.

## Nullable GraphQL response fields

Use `/// @graphqlNullable` when a field is required in Prisma but a custom resolver may return
`null`, for example when a caller lacks premium access:

```prisma
model AudioFile {
  id String @id
  /// @graphqlNullable
  url String
}
```

The `models` generator emits `@Field(() => String, { nullable: true })` and
`url?: string | null`. The database column stays required, and generated CRUD input requirements
are unchanged. The custom resolver owns the access check. No database migration is needed. Regenerate models
and the GraphQL client SDK after adding the annotation.

The annotation supports scalars, enums, and lists. Lists become nullable while their items remain
non-null. Fields without the annotation retain their existing nullability, and `@graphqlOmit`
takes precedence over `@graphqlNullable`.

## Model extensions

Generated CRUD resolvers are registered by `ApiGeneratedCrudFeatureModule`. Custom model behavior
is additive and must not inherit a generated resolver. Scaffold a conventional model-adjacent
resolver module only when the model needs custom behavior:

```sh
nx g @nestledjs/generators:model-extension User
```

This creates `libs/api/custom/src/lib/default/user/user.{module,resolver}.ts`, exports the module,
and adds it to the API's `defaultModules`. The default artifact name follows the Prisma model; use
`--name` when a more specific feature name is clearer:

```sh
nx g @nestledjs/generators:model-extension User --name=UserProfile
```

Both resolvers target the `User` GraphQL model. The name and folder layout are conventions, not an
inheritance contract.

## Admin CRUD boundary

Generated CRUD is always protected at resolver-class level with `@AdminOnly()` and
`GqlAuthAdminGuard`. Generator 3 rejects the removed `@crudAuth` annotation so a schema cannot
lower generated operations to user or public access.

User-facing operations belong in additive custom resolvers with purpose-built inputs and explicit,
authenticated Prisma queries. The recursive selection compiler used by generated CRUD is inlined
inside the generated data-access service and is not exported for application code.

## Building

Run `nx build generators` to build the library.

## Running unit tests

Run `nx test generators` to execute the unit tests via [Vitest](https://vitest.dev/).
