#!/usr/bin/env node
// .mjs stays ESM regardless of the package type, so reach it with a dynamic import, and carry the
// exit code back deliberately (see nestled-verify-selects.js).
import('../src/verify-select-coverage.mjs')
  .then(({ runCli }) => runCli())
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 2
  })
