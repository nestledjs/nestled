#!/usr/bin/env node
import('../src/verify-select-coverage.mjs').then((module) => (module.runCli ?? module.default)())
