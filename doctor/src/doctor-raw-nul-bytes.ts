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

/** 1-based line numbers of every raw NUL byte in a file's contents. */
export const findRawNulLines = (buffer: Buffer): number[] => {
  const lines: number[] = []
  let index = buffer.indexOf(0)
  while (index !== -1) {
    lines.push(buffer.subarray(0, index).toString('utf8').split('\n').length)
    index = buffer.indexOf(0, index + 1)
  }
  return lines
}
