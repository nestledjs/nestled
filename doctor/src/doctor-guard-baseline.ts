export type GuardBaseline = Record<string, Record<string, string[]>>

const owns = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key)

export const missingGuardOperations = (baseline: GuardBaseline, current: GuardBaseline) =>
  Object.entries(current).flatMap(([file, methods]) =>
    Object.keys(methods)
      .filter((method) => !owns(baseline[file] ?? {}, method))
      .map((method) => ({ file, method })),
  )

/** An explicit selection changes only those entries, including deliberately removed operations. */
export const mergeGuardBaseline = (
  baseline: GuardBaseline,
  current: GuardBaseline,
  operations: readonly string[],
): GuardBaseline => {
  if (operations.length === 0) return current
  const result: GuardBaseline = JSON.parse(JSON.stringify(baseline))
  for (const operation of operations) {
    const parts = operation.split('::')
    const [file, method] = parts
    if (parts.length !== 2 || !file || !method) {
      throw new Error(`Invalid guard operation ${operation}; use <file>::<operation>`)
    }
    if (!owns(current[file] ?? {}, method) && !owns(baseline[file] ?? {}, method)) {
      throw new Error(`Unknown guard operation ${operation}; baseline was not changed`)
    }
    if (owns(current[file] ?? {}, method)) {
      result[file] = { ...result[file], [method]: [...current[file][method]] }
    } else {
      delete result[file][method]
      if (Object.keys(result[file]).length === 0) delete result[file]
    }
  }
  return result
}

export const guardOperationSelections = (args: readonly string[]): string[] => {
  const selections: string[] = []
  for (let index = 0; index < args.length; index++) {
    if (args[index] !== '--guard-operation') continue
    const value = args[++index]
    if (!value || value.startsWith('--')) throw new Error('--guard-operation requires <file>::<operation>')
    selections.push(value)
  }
  if (selections.length && !args.includes('--update-guard-baseline')) {
    throw new Error('--guard-operation requires --update-guard-baseline')
  }
  return selections
}
