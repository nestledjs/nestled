"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.DOCKER_COMPOSE_FILE = exports.DATABASE_URL = exports.WORKSPACE_NAME = exports.MAX_RETRIES = void 0;
exports.log = log;
exports.connectToPostgres = connectToPostgres;
exports.canConnect = canConnect;
exports.ensureDockerIsRunning = ensureDockerIsRunning;
exports.isDockerComposeRunning = isDockerComposeRunning;
exports.ensureDockerComposeIsRunning = ensureDockerComposeIsRunning;
exports.ensureDotEnv = ensureDotEnv;
exports.runPrismaSetup = runPrismaSetup;
exports.runPrismaSeed = runPrismaSeed;
exports.runGraphQLTypeGeneration = runGraphQLTypeGeneration;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const pg_1 = require("pg");
exports.MAX_RETRIES = 30;
exports.WORKSPACE_NAME = (0, path_1.basename)(process.cwd());
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.DOCKER_COMPOSE_FILE = '.dev/docker-compose.yml';
function log(...msg) {
    console.log(`[${exports.WORKSPACE_NAME}]`, ...msg);
}
function connectToPostgres(url) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = new pg_1.Client(url);
        yield client.connect();
        return client;
    });
}
function canConnect(url) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield connectToPostgres(url);
            log('Connected to Postgres');
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
function ensureDockerIsRunning() {
    try {
        (0, child_process_1.execSync)('docker ps', { stdio: 'ignore' });
        log('Docker is Up');
        return true;
    }
    catch (e) {
        throw new Error(`Make sure Docker is running, then run this again`);
    }
}
function isDockerComposeRunning() {
    try {
        const res = (0, child_process_1.execSync)(`docker compose -f ${exports.DOCKER_COMPOSE_FILE} top`, {
            stdio: ['inherit', 'inherit'],
        });
        if (res) {
            log('Docker Compose is Running');
            return true;
        }
        return false;
    }
    catch (e) {
        return false;
    }
}
function ensureDockerComposeIsRunning() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const isRunning = isDockerComposeRunning();
        if (isRunning) {
            return true;
        }
        try {
            (0, child_process_1.execSync)(`docker compose -f ${exports.DOCKER_COMPOSE_FILE} up -d`, { stdio: 'ignore' });
            yield waitForConnection();
            log('Docker Compose Started');
        }
        catch (e) {
            throw new Error(`Make sure Docker Compose is running`);
        }
    });
}
function ensureDotEnv() {
    try {
        if (!(0, fs_1.existsSync)('.env')) {
            (0, fs_1.writeFileSync)('.env', (0, fs_1.readFileSync)('.env.example'));
            log('.env created (copied from .env.example)');
        }
        else {
            log('.env exists');
        }
    }
    catch (e) {
        throw new Error(`Error creating or reading.env file`);
    }
}
function runPrismaSetup() {
    try {
        (0, child_process_1.execSync)('pnpm prisma:apply', { stdio: 'ignore' });
        log('Prisma Setup is Done');
        return true;
    }
    catch (e) {
        throw new Error(`There was an issue running 'pnpm prisma:apply'`);
    }
}
function runPrismaSeed() {
    try {
        (0, child_process_1.execSync)('npx prisma db seed -- --confirm --timeout 0', { stdio: 'inherit' });
        log('Prisma Seed is Done');
        return true;
    }
    catch (e) {
        console.error('Prisma Seed Error:', e.message);
        throw new Error(`There was an issue running 'pnpm prisma:seed': ${e.message}`);
    }
}
function runGraphQLTypeGeneration() {
    try {
        (0, child_process_1.execSync)('pnpm generate:models', { stdio: 'inherit' });
        log('GraphQL types generation is done');
        return true;
    }
    catch (e) {
        console.error('GraphQL types generation error:', e.message);
        throw new Error(`There was an issue running 'pnpm generate:models': ${e.message}`);
    }
}
const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
function waitForConnection() {
    log('Waiting for Postgres to connect');
    return new Promise((resolve, reject) => {
        let count = 0;
        function tryConnect() {
            if (count >= exports.MAX_RETRIES) {
                reject();
                return;
            }
            canConnect(exports.DATABASE_URL).then((isConnected) => {
                if (isConnected) {
                    resolve();
                }
                else {
                    count++;
                    (0, exports.sleep)().then(tryConnect);
                }
            });
        }
        tryConnect();
    });
}
//# sourceMappingURL=helpers.js.map