import React, { lazy, Suspense, useCallback, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'
import type { MDXEditorMethods } from '@mdxeditor/editor'

// --- Extracted Helpers ---

// Default image upload handler for base64 mode
export const defaultImageUploadHandler =
  (imageUploadMode: string) =>
  async (file: File): Promise<string> => {
    if (imageUploadMode === 'base64') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    throw new Error('Custom image upload handler required for non-base64 mode')
  }

// Validate and handle image upload
export const handleImageUpload = async ({
  file,
  maxImageSize,
  allowedImageTypes,
  imageUploadHandler,
}: {
  file: File
  maxImageSize: number
  allowedImageTypes: string[]
  imageUploadHandler: (file: File) => Promise<string>
}): Promise<string> => {
  // Check file size
  if (file.size > maxImageSize) {
    throw new Error(`Image size must be less than ${Math.round(maxImageSize / 1024 / 1024)}MB`)
  }

  // Check file type
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error(`Image type must be one of: ${allowedImageTypes.join(', ')}`)
  }

  // Use custom handler or default
  return await imageUploadHandler(file)
}

// Convert markdown to HTML using ReDoS-safe regex patterns
// SECURITY: This function includes protections against ReDoS (Regular Expression Denial of Service):
// 1. Input size limits (100KB max)
// 2. Length-bounded capture groups
// 3. Negated character classes instead of .* patterns
// 4. Non-greedy quantifiers where appropriate
// For production use with untrusted input, consider server-side conversion with battle-tested parsers
export const markdownToHtml = async (markdown: string): Promise<string> => {
  // Prevent DoS by limiting input size (100KB max)
  const MAX_INPUT_SIZE = 100 * 1024
  if (markdown.length > MAX_INPUT_SIZE) {
    console.warn('Markdown input too large, truncating to prevent DoS')
    markdown = markdown.substring(0, MAX_INPUT_SIZE)
  }

  // Simple markdown to HTML conversion with ReDoS-safe patterns
  // For production use, consider using libraries like 'marked' or 'markdown-it'
  if (typeof window !== 'undefined') {
    try {
      // Use non-backtracking patterns to prevent ReDoS
      return (
        markdown
          // Headings - safe patterns with line boundaries and length limits
          .replace(/^### ([^\r\n]{0,200})$/gim, '<h3>$1</h3>')
          .replace(/^## ([^\r\n]{0,200})$/gim, '<h2>$1</h2>')
          .replace(/^# ([^\r\n]{0,200})$/gim, '<h1>$1</h1>')

          // Bold text - ReDoS-safe pattern with negated character class and length limit
          .replace(/\*\*([^*\r\n]{1,500}?)\*\*/gim, '<strong>$1</strong>')

          // Italic text - ReDoS-safe pattern with negated character class and length limit
          .replace(/\*([^*\r\n]{1,500}?)\*/gim, '<em>$1</em>')

          // Images - safe with negated character classes and length limits
          .replace(/!\[([^\]]{0,200})\]\(([^)\s]{1,500})\)/gim, '<img alt="$1" src="$2" />')

          // Links - safe with negated character classes and length limits
          .replace(/\[([^\]]{0,200})\]\(([^)\s]{1,500})\)/gim, '<a href="$2">$1</a>')

          // Line breaks
          .replace(/\n$/gim, '<br />')
      )
    } catch (error) {
      console.warn('Failed to convert markdown to HTML:', error)
      return markdown
    }
  }
  return markdown
}

// Toolbar contents as a top-level function
export const toolbarContents = ({
  enableImageUpload,
  UndoRedo,
  Separator,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  CreateLink,
  InsertImage,
}: {
  enableImageUpload: boolean
  UndoRedo: React.ComponentType<object>
  Separator: React.ComponentType<object>
  BoldItalicUnderlineToggles: React.ComponentType<object>
  CodeToggle: React.ComponentType<object>
  ListsToggle: React.ComponentType<object>
  CreateLink: React.ComponentType<object>
  InsertImage: React.ComponentType<Record<string, never>>
}) => (
  <>
    <UndoRedo />
    <Separator />
    <BoldItalicUnderlineToggles />
    <CodeToggle />
    <Separator />
    <ListsToggle />
    <Separator />
    <CreateLink />
    {enableImageUpload && (
      <>
        <Separator />
        <InsertImage />
      </>
    )}
  </>
)

// Simple loading component
const EditorLoading = ({ height = 300 }: { height?: number }) => (
  <div
    className="border border-gray-300 rounded-md p-4 flex items-center justify-center text-gray-500"
    style={{ minHeight: `${height}px` }}
  >
    Loading editor...
  </div>
)

// Track instances using custom z-index for proper cleanup
// This prevents memory leaks by only removing the global style tag when all instances are unmounted
let customZIndexInstanceCount = 0

// Custom hook for managing popup z-index styles
const usePopupZIndex = (popupZIndex?: number) => {
  useEffect(() => {
    if (!popupZIndex || typeof window === 'undefined') return

    const styleId = 'mdx-editor-popup-z-index'
    let style = document.getElementById(styleId) as HTMLStyleElement

    // Increment instance counter
    customZIndexInstanceCount++

    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }

    style.textContent = `
      .mdxeditor-popup-container {
        z-index: ${popupZIndex} !important;
      }
      .mdxeditor .mdxeditor-popup-container * {
        z-index: ${popupZIndex} !important;
      }
    `

    return () => {
      // Decrement instance counter and cleanup if no instances remain
      customZIndexInstanceCount--
      if (customZIndexInstanceCount <= 0) {
        const styleElement = document.getElementById(styleId)
        if (styleElement) {
          document.head.removeChild(styleElement)
        }
        // Reset counter to prevent negative values
        customZIndexInstanceCount = 0
      }
    }
  }, [popupZIndex])

  return popupZIndex
    ? ({
        '--mdx-popup-z-index': popupZIndex.toString(),
      } as React.CSSProperties)
    : undefined
}

// Extract plugin configuration
const createEditorPlugins = (
  enableImageUpload: boolean,
  imageUploadHandler: (file: File) => Promise<string>,
  readOnly: boolean,
  pluginComponents: any,
) => {
  const {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
  } = pluginComponents

  const basePlugins = [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    markdownShortcutPlugin(),
  ]

  const imagePlugins = enableImageUpload ? [imagePlugin({ imageUploadHandler })] : []

  const toolbarPlugins = readOnly
    ? []
    : [
        toolbarPlugin({
          toolbarContents: () =>
            toolbarContents({
              enableImageUpload,
              ...pluginComponents.toolbarComponents,
            }),
        }),
      ]

  return [...basePlugins, ...imagePlugins, ...toolbarPlugins]
}

// Extract image upload wrapper creation
const createImageUploadWrapper = (
  imageUploadHandler?: (file: File) => Promise<string>,
  imageUploadMode = 'base64',
  maxImageSize = 5 * 1024 * 1024,
  allowedImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
) => {
  const handler = imageUploadHandler || defaultImageUploadHandler(imageUploadMode)
  return async (file: File): Promise<string> =>
    handleImageUpload({
      file,
      maxImageSize,
      allowedImageTypes,
      imageUploadHandler: handler,
    })
}

// Extract change handler logic as a custom hook
const useChangeHandler = (
  onChange: (value: string) => void,
  outputFormat: 'markdown' | 'html' | 'both',
  onHtmlChange?: (html: string) => void,
) => {
  return useCallback(
    async (newValue: string) => {
      onChange(newValue) // Always provide markdown

      // If we need HTML output as well
      if ((outputFormat === 'html' || outputFormat === 'both') && onHtmlChange) {
        try {
          const html = await markdownToHtml(newValue)
          onHtmlChange(html)
        } catch (error) {
          console.warn('Failed to convert markdown to HTML:', error)
        }
      }
    },
    [onChange, onHtmlChange, outputFormat],
  )
}

// Simplified editor component interface
interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  enableImageUpload?: boolean
  imageUploadHandler?: (file: File) => Promise<string>
  maxImageSize?: number
  allowedImageTypes?: string[]
  imageUploadMode?: 'immediate' | 'base64' | 'custom'
  outputFormat?: 'markdown' | 'html' | 'both'
  onHtmlChange?: (html: string) => void
  overlayContainer?: HTMLElement | null
  popupZIndex?: number
}

// Create the editor component factory
const createSimpleEditor = (mod: any) => {
  const {
    MDXEditor,
    toolbarPlugin,
    listsPlugin,
    quotePlugin,
    headingsPlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,
    markdownShortcutPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    CodeToggle,
    CreateLink,
    InsertImage,
    ListsToggle,
    Separator,
  } = mod

  const toolbarComponents = {
    UndoRedo,
    Separator,
    BoldItalicUnderlineToggles,
    CodeToggle,
    ListsToggle,
    CreateLink,
    InsertImage,
  }

  const pluginComponents = {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    toolbarComponents,
  }

  return React.forwardRef<MDXEditorMethods, SimpleEditorProps>((props, ref) => {
    const {
      value,
      onChange,
      onBlur,
      placeholder,
      readOnly = false,
      className,
      enableImageUpload = false,
      imageUploadHandler,
      maxImageSize = 5 * 1024 * 1024,
      allowedImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      imageUploadMode = 'base64',
      outputFormat = 'markdown',
      onHtmlChange,
      overlayContainer,
      popupZIndex,
    } = props

    const editorStyle = usePopupZIndex(popupZIndex)
    const handleChange = useChangeHandler(onChange, outputFormat, onHtmlChange)

    const imageUploadWrapper = createImageUploadWrapper(
      imageUploadHandler,
      imageUploadMode,
      maxImageSize,
      allowedImageTypes,
    )

    const plugins = createEditorPlugins(enableImageUpload, imageUploadWrapper, readOnly, pluginComponents)

    return (
      <div style={editorStyle}>
        <MDXEditor
          ref={ref}
          markdown={value || ''}
          onChange={handleChange}
          onBlur={onBlur}
          plugins={plugins}
          readOnly={readOnly}
          placeholder={placeholder}
          className={className}
          overlayContainer={overlayContainer}
        />
      </div>
    )
  })
}

// Lazy load MDXEditor with extracted configuration
const MDXEditor = lazy(() =>
  import('@mdxeditor/editor').then((mod) => {
    const SimpleEditor = createSimpleEditor(mod)
    SimpleEditor.displayName = 'SimpleEditor'
    return { default: SimpleEditor }
  }),
)

export function MarkdownEditor({
  form,
  field,
  hasError,
  formReadOnly = false,
  formReadOnlyStyle = 'value',
}: FormFieldProps<Extract<FormField, { type: FormFieldType.MarkdownEditor }>> & {
  formReadOnly?: boolean
  formReadOnlyStyle?: 'value' | 'disabled'
}) {
  const theme = useFormTheme()
  const htmlFieldKey = `${field.key}_html` // Store HTML in a separate field if needed

  // Determine the read-only state with field-level precedence
  const isReadOnly = field.options.readOnly ?? formReadOnly
  const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle

  // Handle read-only rendering
  if (isReadOnly) {
    const value = form.getValues(field.key) ?? ''

    if (readOnlyStyle === 'disabled') {
      return (
        <>
          <div
            className={clsx(
              theme.markdownEditor.editor,
              theme.markdownEditor.disabled,
              hasError && theme.markdownEditor.error,
            )}
          >
            <div className={theme.markdownEditor.toolbar}>
              <span className="text-sm text-gray-500">Markdown Editor (Disabled)</span>
            </div>
            <div
              className={clsx(
                theme.markdownEditor.preview,
                'opacity-50 min-h-[200px] p-4 font-mono text-sm whitespace-pre-wrap',
              )}
            >
              {value ?? '—'}
            </div>
          </div>
          {field.options.helpText && <div className={theme.markdownEditor.helpText}>{field.options.helpText}</div>}
        </>
      )
    }

    // Render as a plain value (using MDXEditor in read-only mode)
    return (
      <>
        <div className={clsx(theme.markdownEditor.readOnlyValue)}>
          <Suspense fallback={<EditorLoading height={200} />}>
            <MDXEditor
              value={value}
              onChange={() => {
                /* No-op for read-only */
              }}
              readOnly={true}
              className="border-none bg-transparent prose prose-sm max-w-none [&_.mdxeditor-root-contenteditable]:list-decimal [&_.mdxeditor-root-contenteditable]:list-inside [&_.mdxeditor-root-contenteditable_ul]:list-disc [&_.mdxeditor-root-contenteditable_ol]:list-decimal"
              enableImageUpload={field.options.enableImageUpload}
              imageUploadHandler={field.options.imageUploadHandler}
              maxImageSize={field.options.maxImageSize}
              allowedImageTypes={field.options.allowedImageTypes}
              imageUploadMode={field.options.imageUploadMode}
              outputFormat={field.options.outputFormat}
              onHtmlChange={field.options.onHtmlChange}
              overlayContainer={field.options.overlayContainer}
              popupZIndex={field.options.popupZIndex}
            />
          </Suspense>
        </div>
        {field.options.helpText && <div className={theme.markdownEditor.helpText}>{field.options.helpText}</div>}
      </>
    )
  }

  // Regular field rendering
  return (
    <Controller
      control={form.control}
      name={field.key}
      defaultValue={field.options.defaultValue ?? ''}
      rules={{
        required: field.options.required,
        maxLength: field.options.maxLength
          ? {
              value: field.options.maxLength,
              message: `Content must be less than ${field.options.maxLength} characters`,
            }
          : undefined,
      }}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <div className={theme.markdownEditor.wrapper}>
          <Suspense fallback={<EditorLoading height={field.options.height ?? 300} />}>
            <div
              className={clsx(
                theme.markdownEditor.editor,
                hasError && theme.markdownEditor.error,
                field.options.disabled && theme.markdownEditor.disabled,
              )}
              style={{ minHeight: `${field.options.height ?? 300}px` }}
            >
              <MDXEditor
                ref={ref}
                value={value ?? ''}
                onChange={(newValue: string) => {
                  // Enforce max length if specified
                  if (field.options.maxLength && newValue.length > field.options.maxLength) {
                    return
                  }
                  onChange(newValue)
                }}
                onBlur={onBlur}
                placeholder={field.options.placeholder}
                readOnly={field.options.disabled}
                className="w-full prose prose-sm max-w-none [&_.mdxeditor-root-contenteditable]:list-decimal [&_.mdxeditor-root-contenteditable]:list-inside [&_.mdxeditor-root-contenteditable_ul]:list-disc [&_.mdxeditor-root-contenteditable_ol]:list-decimal"
                enableImageUpload={field.options.enableImageUpload}
                imageUploadHandler={field.options.imageUploadHandler}
                maxImageSize={field.options.maxImageSize}
                allowedImageTypes={field.options.allowedImageTypes}
                imageUploadMode={field.options.imageUploadMode}
                outputFormat={field.options.outputFormat}
                overlayContainer={field.options.overlayContainer}
                popupZIndex={field.options.popupZIndex}
                onHtmlChange={(html: string) => {
                  // Store HTML in a separate field if outputFormat is 'both'
                  if (field.options.outputFormat === 'both') {
                    form.setValue(htmlFieldKey, html)
                  }
                  // Call custom callback if provided
                  if (field.options.onHtmlChange) {
                    field.options.onHtmlChange(html)
                  }
                }}
              />
              {field.options.maxLength && (
                <div className="text-sm text-gray-500 mt-1 text-right">
                  {value?.length ?? 0}/{field.options.maxLength}
                </div>
              )}
            </div>
          </Suspense>
          {field.options.helpText && <div className={theme.markdownEditor.helpText}>{field.options.helpText}</div>}
        </div>
      )}
    />
  )
}
