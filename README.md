# NestledJS

NestledJS is a powerful monorepo built on [Nx](https://nx.dev) that provides a collection of libraries and tools to accelerate full-stack application development. It simplifies setting up new projects by providing code generators, reusable form components, and helper utilities.

## Core Libraries

The NestledJS monorepo includes three primary libraries:

- **`@nestledjs/generators`**: A set of Nx generators to scaffold a complete full-stack application, including API, web frontend, and shared libraries. **(Under Development)**
- **`@nestledjs/forms`**: A robust library for building, validating, and managing forms in your applications. **(Ready for Use)**
- **`@nestledjs/helpers`**: A collection of helper functions and utilities to support development across the monorepo.

## Local Development with YALC

To test the NestledJS libraries in your local projects, you can use [YALC](https://github.com/wclr/yalc). YALC acts as a local package repository, allowing you to "publish" your packages locally and link them to other projects.

1.  **Publish a package locally:**

    ```sh
    yalc publish
    ```

2.  **In your consumer project, link the package:**

    ```sh
    yalc add @nestledjs/forms
    pnpm install
    ```

## Generators

The `@nestledjs/generators` library is designed to quickly scaffold a full-stack application. While it is still under development, it provides a solid foundation for new projects.

### Full Stack Generation

To generate a complete project, run the following commands in order:

```sh
nx g @nestledjs/config:setup
nx g @nestledjs/config:init
nx g @nestledjs/api:setup
nx g @nestledjs/api:app
nx g @nestledjs/api:prisma
nx g @nestledjs/api:config
nx g @nestledjs/api:core
nx g @nestledjs/api:custom
nx g @nestledjs/api:smtp-mailer
nx g @nestledjs/api:generate-crud
nx g @nestledjs/api:utils
nx g @nestledjs/api:custom
nx g @nestledjs/shared:sdk
nx g @nestledjs/shared:styles
nx g @nestledjs/plugins:auth
nx g @nestledjs/api:workspace-setup
nx g @nestledjs/web:setup
nx g @nestledjs/web:app
nx g @nestledjs/shared:apollo
```

## Forms

The `@nestledjs/forms` library is stable and ready for production use. It provides a comprehensive solution for form creation and management.

For detailed documentation on how to use the forms library, please see its dedicated [README.md](./forms/README.md).
