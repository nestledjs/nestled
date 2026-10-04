/**
 * A raw NUL (0x00) byte in a source file makes GNU grep and ripgrep classify the whole file as binary
 * and silently return no matches, so the code in it becomes invisible to search: no error, no warning.
 * One repository hit it for real, through strings built with a literal 0x00. The fix is always the
 * two-character escape `\x00` inside a string or template literal.
 *
 * `.snap` is included on purpose: Jest's pretty-format escapes only `"` and `\`, so a NUL-bearing
 * value reaching a snapshot writes a raw byte into the `.snap`, reintroducing the defect.
 */
export const RAW_NUL_SOURCE_PATTERN = /\.(ts|tsx|cts|mts|js|jsx|cjs|mjs|json|prisma|graphql|md|snap)$/

/**
 * 1-based line numbers of every raw NUL byte in a file's contents, in one pass over the bytes. In UTF-8
 * a newline byte (0x0a) never occurs inside a multi-byte character, so counting bytes gives the same
 * line numbers as decoding, without re-decoding the prefix for every NUL found.
 */
export const findRawNulLines = (buffer: Buffer): number[] => {
  const lines: number[] = []
  let line = 1
  for (const byte of buffer) {
    if (byte === 0x0a) line++
    else if (byte === 0x00) lines.push(line)
  }
  return lines
}
