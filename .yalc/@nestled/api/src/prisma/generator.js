"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateLibraries;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const utils_1 = require("@nestled/utils");
function generateLibraries(tree_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function* (tree, options = {}) {
        const templateRootPath = (0, devkit_1.joinPathFragments)(__dirname, './files');
        const overwrite = options.overwrite === true;
        // Update package.json
        (0, devkit_1.updateJson)(tree, 'package.json', (json) => {
            // Add prisma schema path
            json.prisma = {
                schema: 'libs/api/prisma/src/lib/schemas',
                seed: 'ts-node --project libs/api/core/models/tsconfig.lib.json libs/api/prisma/src/lib/seed/seed.ts',
            };
            // Add GraphQL model generation script for the 'core' library
            if (!json.scripts) {
                json.scripts = {};
            }
            if (!json.scripts['generate:models']) {
                json.scripts['generate:models'] =
                    'ts-node --project libs/api/core/models/tsconfig.lib.json libs/api/core/models/src/lib/generate-models.ts';
            }
            // Add all requested prisma scripts if not already present
            if (!json.scripts['prisma:apply']) {
                json.scripts['prisma:apply'] = 'pnpm prisma:format && pnpm prisma db push';
            }
            if (!json.scripts['prisma:db-push']) {
                json.scripts['prisma:db-push'] = 'pnpm prisma db push';
            }
            if (!json.scripts['prisma:format']) {
                json.scripts['prisma:format'] = 'pnpm prisma format';
            }
            if (!json.scripts['prisma:generate']) {
                json.scripts['prisma:generate'] = 'pnpm prisma generate';
            }
            if (!json.scripts['prisma:migrate']) {
                json.scripts['prisma:migrate'] = 'pnpm prisma migrate save && pnpm prisma migrate up';
            }
            if (!json.scripts['prisma:seed']) {
                json.scripts['prisma:seed'] =
                    'ts-node --project libs/api/prisma/tsconfig.lib.json libs/api/prisma/src/lib/seed/seed.ts';
            }
            if (!json.scripts['prisma:studio']) {
                json.scripts['prisma:studio'] = 'pnpm nx prisma:studio api';
            }
            if (!json.scripts['prisma:reset']) {
                json.scripts['prisma:reset'] = 'pnpm prisma migrate reset && pnpm prisma:seed';
            }
            return json;
        });
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'prisma', overwrite }, templateRootPath);
        yield (0, devkit_1.formatFiles)(tree);
        return () => {
            (0, devkit_1.installPackagesTask)(tree);
        };
    });
}
//# sourceMappingURL=generator.js.map