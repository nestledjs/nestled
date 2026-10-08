export type ReasonedExemptions = Record<string, Record<string, string>>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Every exemption names a file, an operation, and a reviewable non-empty reason. */
export const parseReasonedExemptions = (source: string): ReasonedExemptions => {
  const value: unknown = JSON.parse(source)
  if (!isRecord(value)) throw new Error('Expected an object keyed by source file')
  for (const [file, operations] of Object.entries(value)) {
    if (!isRecord(operations)) throw new Error(`${file}: expected an object keyed by operation`)
    for (const [name, reason] of Object.entries(operations)) {
      if (typeof reason !== 'string' || !reason.trim()) throw new Error(`${file}::${name} needs a non-empty reason`)
    }
  }
  return value as ReasonedExemptions
}
