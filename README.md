<!-- TODO: Add logo here -->
<!-- <p align="center"><img src="./assets/logo.png" alt="NestledJS" width="400" /></p> -->

# NestledJS

> If you are here because you want to rapidly deploy a site using NestledJS, please go to [nestledjs.com](https://nestledjs.com) and read the official docs.

**This README is for developers contributing to the NestledJS generator framework.**

## Overview

NestledJS has shifted from whole-site generation to **starter templates** paired with generators for ongoing development tasks. Rather than scaffolding an entire project from scratch, developers clone a starter template and use generators to keep their codebase in sync with their Prisma schema.

### The Generative API Philosophy

The core of NestledJS is `db-update` — a single command that regenerates your API layer from your Prisma schema:

```sh
pnpm db-update
```

This runs:

```json
"db-update": "nx g @nestledjs/api:generate-crud && pnpm generate:models && nx g @nestledjs/shared:sdk && nx g @nestledjs/api:custom"
```

1. **`generate-crud`** — Generates CRUD resolvers and services from your Prisma models
2. **`generate:models`** — Generates GraphQL model types
3. **`shared:sdk`** — Generates the GraphQL client SDK (fragments, mutations, queries)
4. **`api:custom`** — Generates custom library wrappers for your models

When you first clone a starter template, `workspace-setup` handles the initial environment — spinning up Docker, running migrations, and seeding the database.

## Generators

### Active Generators

These are the generators actively maintained for use in our starter templates:

| Generator | Description |
|---|---|
| `@nestledjs/api:generate-crud` | Generate CRUD resolvers/services from Prisma models |
| `@nestledjs/api:custom` | Generate custom library wrappers for models |
| `@nestledjs/shared:sdk` | Generate the GraphQL client SDK |
| `@nestledjs/api:workspace-setup` | Set up the workspace environment (Docker, migrations, seeds) |
| `@nestledjs/api:plugin` | Generate a blank plugin module (module, service, resolver) |
| `@nestledjs/plugins:integration` | Generate a new integration library |

### Legacy / Internal Generators

These generators were used to build the starter templates themselves. They are not needed for day-to-day development but serve as useful educational examples of Nx code generation:

| Generator | Description |
|---|---|
| `@nestledjs/config:setup` | Install workspace dependencies |
| `@nestledjs/config:init` | Initialize workspace config, Docker, env files |
| `@nestledjs/api:setup` | Set up API dependencies (NestJS, GraphQL, Prisma) |
| `@nestledjs/api:app` | Create the main NestJS application |
| `@nestledjs/api:prisma` | Create the Prisma library |
| `@nestledjs/api:config` | Create the API config library |
| `@nestledjs/api:account` | Create the account feature library |
| `@nestledjs/api:user` | Create the user feature library |
| `@nestledjs/api:core` | Create the core GraphQL/auth infrastructure |
| `@nestledjs/api:smtp-mailer` | Create the SMTP mailer integration |
| `@nestledjs/api:utils` | Create the auth utilities library |
| `@nestledjs/api:integrations` | Create the integrations library |
| `@nestledjs/plugins:auth` | Generate auth plugin |
| `@nestledjs/shared:styles` | Generate shared styles with Tailwind CSS |
| `@nestledjs/shared:apollo` | Generate Apollo client config |
| `@nestledjs/web:setup` | Set up web dependencies (React Router, Apollo) |
| `@nestledjs/web:app` | Create the web application |

## Local Development with YALC

To test the NestledJS generator packages in your local projects, you can use [YALC](https://github.com/wclr/yalc). YALC acts as a local package repository, allowing you to publish packages locally and link them to other projects.

1. **Publish a package locally:**

    ```sh
    yalc publish
    ```

2. **In your consumer project, link the package:**

    ```sh
    yalc add @nestledjs/generators
    pnpm install
    ```
