#!/usr/bin/env node
// .mjs stays ESM regardless of the package type, so reach it with a dynamic import.
import('../src/verify-selects.mjs').then(({ runCli }) => runCli())
