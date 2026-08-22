#!/usr/bin/env node
// runCli sets process.exitCode itself, but it is async: awaiting it is what guarantees the code is
// set before the process settles.
const { runCli } = require('../src/verify-fragment-coverage.js')
Promise.resolve(runCli()).catch((error) => {
  console.error(error)
  process.exitCode = 2
})
