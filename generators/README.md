# @nestledjs/generators

Nx generators for keeping a Nestled workspace aligned with its Prisma schema and for scaffolding
explicit API extensions.

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

## Building

Run `nx build generators` to build the library.

## Running unit tests

Run `nx test generators` to execute the unit tests via [Vitest](https://vitest.dev/).
