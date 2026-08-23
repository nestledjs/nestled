const { existsSync, readFileSync } = require('node:fs')
const { resolve } = require('node:path')

/**
 * Repo layout config and the shared "checked nothing" verdict.
 *
 * This lives in a CommonJS module rather than beside the ESM verifiers for one blunt reason: the
 * fragment verifier is compiled to CommonJS, and TypeScript downlevels a dynamic `import()` of an
 * .mjs into `require()`, which cannot load ESM. Both a static and a dynamic import across that
 * boundary shipped broken -- 0.2.0 died with ERR_REQUIRE_ASYNC_MODULE, 0.2.1 with a top-level-await
 * transform error. Keeping the shared code on the CommonJS side removes the boundary instead of
 * negotiating with it.
 */

const REPO_CONFIG_PATH = '.nestled-updates/doctor.config.json'

const DEFAULT_SELECT_FILE_SUFFIXES = ['.select.ts']

/**
 * The few things about a repo's LAYOUT that enforcement cannot assume.
 *
 * Deliberately tiny, and deliberately not a general escape hatch: this declares where to look, never
 * what to accept. A repo that keeps select constants beside the resolver that owns them is laid out
 * differently, not held to a weaker rule.
 *
 * It exists because the alternative is editing the checker in place — which muzebook had to do, and
 * which stops being possible at all once these tools ship as a package.
 */
const readRepoConfig = (
  cwd = process.cwd(),
) => {
  const configPath = resolve(cwd, REPO_CONFIG_PATH)
  if (!existsSync(configPath)) return { selectFileSuffixes: DEFAULT_SELECT_FILE_SUFFIXES }

  let parsed
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    // Fail loudly rather than silently scanning nothing: a malformed config that quietly reverted
    // to the default would make this checker pass by verifying an empty set.
    throw new Error(`${REPO_CONFIG_PATH} is not valid JSON`)
  }

  // A config file that exists is a statement of intent to configure. Silently defaulting on a typoed
  // key — or accepting an empty list — would scan zero files and pass, in exactly the repos that
  // wrote this file BECAUSE the default finds nothing for them. Absent file: default. Present file:
  // say what you mean.
  const declared = parsed?.selectFileSuffixes
  if (
    !Array.isArray(declared) ||
    declared.length === 0 ||
    declared.some((suffix) => typeof suffix !== 'string' || !suffix)
  ) {
    throw new Error(`${REPO_CONFIG_PATH}: selectFileSuffixes must be a non-empty array of non-empty strings`)
  }

  // A repo may legitimately not use the select pattern at all -- 9 of the 11 repos in this fleet do
  // not, both templates included. That is fine; what is not fine is a verifier reporting success
  // for having examined nothing. Declaring it converts an invisible no-op into a recorded decision,
  // and means a repo that DID have selects cannot lose them to a rename without the check noticing.
  const absent = parsed?.noSelectFiles
  if (absent !== undefined && (typeof absent !== 'string' || absent.trim() === '')) {
    throw new Error(`${REPO_CONFIG_PATH}: noSelectFiles must be a non-empty string explaining why this repo has none`)
  }

  return { selectFileSuffixes: declared, noSelectFiles: absent }
}

/**
 * What a verifier should do when it checked nothing.
 *
 * Exit 0 after examining zero files is the failure mode this whole enforcement effort keeps
 * tripping over: the check stops looking and reports clean. A declaration makes the empty state
 * deliberate and visible; its absence makes it a failure with a message naming both ways out.
 */
const reportNothingChecked = (tool, cwd = process.cwd()) => {
  let declared
  try {
    declared = readRepoConfig(cwd).noSelectFiles
  } catch (error) {
    // A malformed config is its own failure with its own fix. Swallowing it here would print the
    // generic "checked 0 files" advice, which tells the reader to edit the very file that cannot
    // be parsed -- and dressing a config error as a verification failure hides which one it is.
    console.error(`\n${tool}: ${error.message}`)
    return 2
  }
  if (declared) {
    // stderr, so --json callers can parse stdout: a human-readable line on stdout would corrupt
    // the machine-readable output for exactly the automated callers this exit code is for.
    console.error(`\n${tool}: checked nothing, as declared in ${REPO_CONFIG_PATH} — ${declared}`)
    return 0
  }
  console.error(
    `\n${tool}: checked 0 files, so this run proves nothing.\n` +
      `  If this repo uses the select pattern, the files moved or were renamed — set\n` +
      `  selectFileSuffixes in ${REPO_CONFIG_PATH} to match.\n` +
      `  If it genuinely has none, say so: "noSelectFiles": "<why>" in the same file.\n` +
      `  Exiting non-zero because a check that examined nothing must not report success.`,
  )
  return 1
}

module.exports = {
  REPO_CONFIG_PATH,
  DEFAULT_SELECT_FILE_SUFFIXES,
  readRepoConfig,
  reportNothingChecked,
}
