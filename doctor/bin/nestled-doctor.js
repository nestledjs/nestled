#!/usr/bin/env node
// The doctor runs on load — importing it IS running it. Kept as a thin bin so the package's entry
// points are declared in one place rather than depending on which module happens to self-invoke.
require('../src/doctor.js')
