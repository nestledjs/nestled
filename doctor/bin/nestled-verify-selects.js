#!/usr/bin/env node
// .mjs stays ESM regardless of the package type, so reach it with a dynamic import.
// The exit code must be carried back deliberately: `.then(({ runCli }) => runCli())` discarded it,
// so this bin reported success for every run, including ones that found real problems.
import('../src/verify-selects.mjs')
  .then(({ runCli }) => runCli())
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 2
  })
