// Read one key out of an already-loaded `.env` body. Shared by every check that inspects local
// env pairings, so the quoting/comment rules stay in one place.
//
// When a key is assigned more than once, the LAST assignment wins — that is what docker compose
// (and dotenv-expand style loaders that override) resolve, so the doctor must judge the value the
// stack actually runs with, not a stale earlier line.
export const readEnvValue = (env: string, key: string): string => {
  let raw: string | undefined
  for (const line of env.split('\n')) {
    const value = assignedValue(line, key)
    if (value !== undefined) raw = value
  }
  return raw === undefined ? '' : parseEnvValue(raw)
}

// The text after `KEY=` when `line` assigns `key` (optionally behind `export `), else undefined.
const assignedValue = (line: string, key: string): string | undefined => {
  let rest = line.trimStart()
  if (rest.startsWith('export ') || rest.startsWith('export\t')) rest = rest.slice('export'.length).trimStart()
  return rest.startsWith(`${key}=`) ? rest.slice(key.length + 1) : undefined
}

// Quoted value: strip the surrounding quotes and keep it verbatim (a trailing ` # comment` after
// the closing quote is dropped). Unquoted value: drop a dotenv-style inline comment — a `#` that
// follows whitespace, including `KEY= # comment`, which is empty — so the parsed value matches
// what the loader produces. (String ops, not regex — avoids backtracking.)
const parseEnvValue = (value: string): string => {
  const raw = value.trim()
  const quote = raw[0]
  if (quote === '"' || quote === "'") {
    if (raw.length >= 2 && raw.endsWith(quote)) return raw.slice(1, -1)
    const closing = raw.indexOf(quote, 1)
    if (closing !== -1 && raw.slice(closing + 1).trimStart().startsWith('#')) return raw.slice(1, closing)
  }
  const commentAt = inlineCommentIndex(value)
  return (commentAt === -1 ? value : value.slice(0, commentAt)).trim()
}

// Index of the first `#` preceded by whitespace (the start of an inline comment), or -1.
const inlineCommentIndex = (value: string): number => {
  for (let i = 1; i < value.length; i++) {
    if (value[i] === '#' && (value[i - 1] === ' ' || value[i - 1] === '\t')) return i
  }
  return -1
}
