/**
 * Separate export for MarkdownEditor to avoid SSR issues.
 * Import this only when you need the MarkdownEditor component.
 *
 * @example
 * ```tsx
 * // Only import when needed, preferably with dynamic imports in Next.js
 * import dynamic from 'next/dynamic'
 * const MarkdownEditor = dynamic(
 *   () => import('@nestledjs/forms/markdown').then(m => m.MarkdownEditor),
 *   { ssr: false }
 * )
 * ```
 */
export { MarkdownEditor } from './lib/fields/markdown-editor'