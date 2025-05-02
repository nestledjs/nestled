# Overview
- This code is a generator function that generates CRUD (Create, Read, Update, Delete) libraries for Prisma models in an NX workspace.
- The generator reads the Prisma schema, extracts the model information, and then generates the necessary data-access and feature libraries for each model.
- The generated libraries are created in the `libs/api` directory of the NX workspace.

# Functions/Classes
- `getAllPrismaModels(tree: Tree)`: This function reads the Prisma schema from the NX workspace, parses the schema using the `getDMMF` function from `@prisma/internals`, and returns an array of model information, including the model name, fields, and a primary field.
- `generateModelCrud(tree: Tree, model: any)`: This function generates the CRUD libraries for a single Prisma model. It first ensures that the `libs/api` directory exists, then calls the `apiCrudGenerator` function from the `../api-crud/generator` module to generate the data-access and feature libraries for the model.
- `default async function(tree: Tree, schema: PrismaCrudGeneratorSchema)`: This is the main entry point of the generator. It first calls `getAllPrismaModels` to get the list of Prisma models, then iterates over the models and calls `generateModelCrud` for each one. Finally, it formats the files and returns a function that installs the necessary packages and logs a success message.

# Behavior Flow
1. The generator is called with a `Tree` object (representing the NX workspace) and a `PrismaCrudGeneratorSchema` object (containing configuration options).
2. The `getAllPrismaModels` function is called to retrieve the list of Prisma models from the schema.
3. If no models are found, an error message is logged, and the generator exits.
4. For each model, the `generateModelCrud` function is called to generate the CRUD libraries.
   - The `libs/api` directory is created if it doesn't exist.
   - The `apiCrudGenerator` function is called to generate the data-access and feature libraries for the model.
   - If an error occurs during the generation, a retry is attempted after a short delay.
5. After all models have been processed, the files are formatted using `formatFiles`.
6. Finally, a function is returned that installs the necessary packages and logs a success message.

# Key Points
- The generator is scoped to only process libraries in the `libs/api` directory.
- The `getDMMF` function from `@prisma/internals` is used to parse the Prisma schema and extract the model information.
- The `apiCrudGenerator` function is called to generate the CRUD libraries for each model.
- Error handling is implemented with a retry mechanism to ensure the generation process is as robust as possible.
- The generated libraries are placed in the `libs/api` directory of the NX workspace.
- After the generation, the user is instructed to run `pnpm prisma:apply` and restart the API to see the changes.