/**
 * Does a change to this path need an upgrade note for downstream projects?
 *
 * Two groups qualify. The first is runtime behaviour a downstream project inherits: the API, the
 * routes, the Prisma schema, and the authorization surfaces.
 *
 * The second is build and workflow tooling — `scripts/` and the root `AGENTS.md`. A downstream
 * project runs `pnpm db-update` and follows the documented workflow, but receives neither through
 * a dependency bump; both arrive only by being copied. A change there is exactly the kind that
 * needs announcing, and until this predicate covered it such a change passed the gate silently
 * even though nothing under `libs/api` had moved.
 *
 * Root `package.json` is deliberately excluded. It churns constantly for reasons downstream does
 * not care about — dependency bumps most of all — and a tooling change worth a note alters a
 * script file or the documented workflow alongside it, so it is caught anyway.
 *
 * Nested `AGENTS.md` files are excluded for the same reason: they carry directory-local
 * contributor guidance, and one sitting under a path that matters is already matched by that
 * path's own rule.
 */
export const isSensitiveTemplatePath = (path: string, schemaPath: string): boolean =>
  /^libs\/api\/(core|custom|utils|integrations)\//.test(path) ||
  path.startsWith('apps/api/') ||
  path.startsWith('apps/web/app/routes/') ||
  path === 'apps/web/app/routes.tsx' ||
  path === schemaPath ||
  path.startsWith('scripts/') ||
  path === 'AGENTS.md' ||
  path.includes('/guards/') ||
  path.includes('/billing/') ||
  path.includes('/auth/') ||
  path.includes('/rbac/') ||
  path.includes('/admin/')
