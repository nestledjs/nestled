export function generators(): string {
  return 'generators'
}

// Re-export commonly used utilities that might be needed at runtime
export { getPluralName } from '@nestledjs/utils'
