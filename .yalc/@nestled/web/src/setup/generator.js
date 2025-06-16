"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSetupGenerator = webSetupGenerator;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const utils_1 = require("@nestled/utils");
function webSetupGenerator(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Add dependencies
        (0, devkit_1.addDependenciesToPackageJson)(tree, {
            'react-router-dom': '^7.6.2',
            '@react-router/dev': '^7.6.2',
            isbot: '5.1.28',
            '@apollo/client': '^3.13.8',
            '@apollo/client-integration-react-router': '0.12.0-alpha.4',
        }, {
            '@nx/react': '21.1.3',
            'vite-tsconfig-paths': '^5.1.4',
            '@tailwindcss/vite': '^4.1.8',
            tailwindcss: '^4.1.8',
        });
        // Update pnpm-workspace.yaml with build dependencies
        const packagesToBuild = ['@tailwindcss/oxide'];
        (0, utils_1.updatePnpmWorkspaceConfig)(tree, { onlyBuiltDependencies: packagesToBuild });
        // Return a callback that will run after the generator completes
        return (0, utils_1.pnpmInstallCallback)();
    });
}
exports.default = webSetupGenerator;
//# sourceMappingURL=generator.js.map