# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NestledJS is a monorepo built on Nx that provides a collection of libraries and generators to accelerate full-stack application development. The core libraries are:

- **`@nestledjs/generators`**: Nx generators to scaffold complete full-stack applications
- **`@nestledjs/helpers`**: Collection of helper functions and utilities

## Development Commands

### Build System (Nx-based)
```bash
# Build affected projects (based on develop branch)
pnpm build

# Build all projects
pnpm build-all

# Build specific project
nx build <project-name>

# Build with dependencies
pnpm nx run-many --target=build --projects=<project> --with-deps
```

### Testing
```bash
# Test affected projects
pnpm test

# Test all projects
pnpm test-all

# Run single project tests
nx test <project-name>

# Test with coverage
nx test <project-name> --coverage

# Full test suite (lint, test, build all projects)
pnpm test-suite
```

### Linting
```bash
# Lint affected projects
pnpm lint

# Lint affected projects with fixes
pnpm lint:fix

# Lint all projects
pnpm lint-all

# Lint all projects with fixes  
pnpm lint-all:fix
```

### Local Development with YALC
```bash
# Publish specific library locally
pnpm push <lib-name>

# Publish all libraries locally in dependency order
pnpm push-all

# Standard yalc publish for single library
pnpm publish-all

# In consumer project
yalc add @nestledjs/generators
pnpm install
```

### Release Management
```bash
# Create releases
pnpm release

# Manual Nx release commands
nx release version
nx release publish
```

## Architecture & Structure

### Monorepo Organization
The repository follows Nx workspace conventions with these main directories:

- **`/helpers/`** - Utility functions and shared helpers
- **`/generators/`** - Nx generator packages organized by domain:
  - `api/` - NestJS API generators (setup, app, prisma, core, CRUD, etc.)
  - `config/` - Configuration generators 
  - `plugins/` - Plugin generators for auth and other features
  - `web/` - Web frontend generators
  - `shared/` - Shared library generators

### Generator Architecture
Each generator follows a strict structure (enforced by `.cursors` rules):
- `schema.json` - JSON Schema defining generator options
- `schema.d.ts` - TypeScript type definitions for the schema
- `generator.ts` - Main generator implementation
- `generator.spec.ts` - Generator tests

**Important**: Generators are meant for external use only and should not be run within this project.

### Key Dependencies
- **Nx 21.3.11**: Monorepo management and build system
- **React 19.1.0**: UI library for forms
- **NestJS 10.x**: Backend framework for API generators
- **Prisma 6.11.0**: Database ORM for generated APIs
- **TypeScript 5.7.3**: Primary development language
- **Vite**: Build tool for libraries
- **Jest/Vitest**: Testing frameworks

## Project-Specific Rules

### Generator Development
- All generators must include the four required files: `schema.json`, `schema.d.ts`, `generator.ts`, `generator.spec.ts`
- Never create `project.json` or `tsconfig.json` in individual generator directories (workspace-level only)
- Test generators externally, not within this project
- Follow dependency order when publishing: helpers → utils → shared → plugins → config → web → api

### Build & Release
- Use PNPM as package manager
- Base branch is `develop` for affected commands
- Build dependencies before publishing with YALC
- Follow conventional commits for releases
- All libraries support independent versioning

### Database & Schema
- Prisma schema located at `libs/api/core/data-access/src/prisma/schema.prisma`
- Seed script at `libs/api/core/data-access/scr/prisma/seed/seed.ts` (note: typo in package.json)
- Generated APIs include full CRUD operations via generators

## Nx Workspace Configuration
- **Default Base**: develop
- **Test Runner**: Jest for most projects, Vitest for React libraries  
- **Build Tool**: Vite for libraries, webpack for some projects
- **Linting**: ESLint with TypeScript support
- **Release**: Independent project releases with GitHub integration
- **Storybook**: Available for component development and documentation