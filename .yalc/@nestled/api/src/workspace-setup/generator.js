"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tslib_1 = require("tslib");
require('dotenv').config();
const helpers_1 = require("./lib/helpers");
function default_1() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        (0, helpers_1.log)('Setting up workspace ');
        (0, helpers_1.ensureDotEnv)();
        require('dotenv').config();
        const DATABASE_URL = process.env.DATABASE_URL;
        if (!DATABASE_URL) {
            throw new Error(`Please provide DATABASE_URL env var`);
        }
        if (!DATABASE_URL.includes('localhost')) {
            throw new Error(`Can't connect to DATABASE_URL if it's not on localhost`);
        }
        const connected = yield (0, helpers_1.canConnect)(DATABASE_URL);
        if (!connected) {
            (0, helpers_1.ensureDockerIsRunning)();
            yield (0, helpers_1.ensureDockerComposeIsRunning)();
        }
        try {
            (0, helpers_1.runPrismaSetup)();
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // Generate GraphQL types from Prisma schema
            (0, helpers_1.log)('Generating GraphQL types from Prisma schema...');
            (0, helpers_1.runGraphQLTypeGeneration)();
            (0, helpers_1.runPrismaSeed)();
            (0, helpers_1.log)('Workspace setup done!');
        }
        catch (error) {
            console.error('Error during workspace setup:', error.message);
        }
    });
}
//# sourceMappingURL=generator.js.map