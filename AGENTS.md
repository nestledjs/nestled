# NestledJS Monorepo - Codex Instructions

## Repository Structure

This is an NX monorepo containing generator packages for the NestledJS framework.

### Packages (in `generators/`)
- `generators` - Meta-package that bundles all generators
- `api` - NestJS API generators (core, CRUD, prisma, workspace-setup)
- `config` - Configuration and Docker setup generators
- `plugins` - Plugin generators
- `web` - Web/frontend generators
- `shared` - Shared utilities across generators
- `utils` - Common NX utilities
- `helpers` - Helper package

### Package Relationships
- `generators` depends on: `api`, `config`, `plugins`, `web`
- `api` depends on: `shared`, `utils`
- `config` depends on: `utils`
- Other packages have similar dependency chains

---

## Releases

### Overview
This monorepo uses NX Release with **independent versioning** - each package has its own version number. Versions are resolved from npm registry (not git tags) to support rebase workflows.

### Release Configuration (nx.json)
- `currentVersionResolver: "registry"` - Gets current version from npm
- `fallbackCurrentVersionResolver: "disk"` - Falls back to package.json
- `conventionalCommits: true` - Parses commit messages for bump detection
- `releaseTag.pattern: "{projectName}@{version}"` - Tag format

### How to Make a Release

When the user asks to "make a release" or "release changes", follow these steps:

#### Step 1: Identify Changed Packages
```bash
# Check commits since last release tags
git log --oneline <package>@<version>..HEAD -- generators/<package>/
```

For each package, check what's on npm vs what's in the codebase:
```bash
npm view @nestledjs/<package> version  # Current npm version
```

#### Step 2: Determine Bump Types
Use conventional commit prefixes to determine bump types:
- `fix:` → patch (0.0.X)
- `feat:` → minor (0.X.0)
- `BREAKING CHANGE:` or `!:` → major (X.0.0)
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` → no bump (skip unless forced)

#### Step 3: Release Specific Packages
```bash
# Release with explicit bump type
npx nx release version <bump> --projects=<package1>,<package2>

# Or for full release (version + changelog + publish)
npx nx release --projects=<package1>,<package2>
```

Examples:
```bash
# Patch release for config
npx nx release version patch --projects=config

# Minor release for api and config
npx nx release version minor --projects=api,config

# Full release flow
npx nx release --projects=config
```

#### Step 4: Verify and Push
The release command will:
1. Update version in package.json
2. Update dependency versions in dependent packages
3. Generate changelog
4. Create git commit and tag
5. Optionally publish to npm

### Important Notes

1. **Always use `--projects` flag** - Without it, NX prompts for every package in the monorepo

2. **Dependency cascading** - When releasing a package, dependent packages may also need releases:
   - Releasing `utils` → may need to release `api`, `config` (they depend on utils)
   - Releasing `api` → may need to release `generators` (it bundles api)

3. **Check what's actually published**:
   ```bash
   npm view @nestledjs/<package> time --json | grep "<version>"
   ```

4. **Dry run first** if unsure:
   ```bash
   npx nx release version patch --projects=config --dry-run
   ```

### Troubleshooting

#### "Which version bump?" prompts for everything
This happens when NX can't auto-detect from conventional commits. Use explicit `--projects` flag and bump type.

#### Version already published
Check npm for actual published version:
```bash
npm view @nestledjs/<package> version
```

#### Orphaned git tags (after rebasing)
Tags can become orphaned after rebasing. The `pnpm sync-tags` script can help, but use with caution - it moves tags which affects conventional commit detection.

---

## Commit Conventions

Use conventional commits for all changes:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature (minor bump)
- `fix` - Bug fix (patch bump)
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc)
- `refactor` - Code refactoring (no feature/fix)
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

Scopes (use package names):
- `api`, `config`, `plugins`, `web`, `shared`, `utils`, `helpers`, `generators`
- `nx` for NX configuration changes
- `tools` for tooling/scripts

Examples:
```
fix(config): use project placeholder for docker container names
feat(api): add new CRUD generator options
chore(nx): update release configuration
```
