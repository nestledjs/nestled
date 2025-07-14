import React, { lazy, Suspense } from 'react'
import { Controller } from 'react-hook-form'
import clsx from 'clsx'
import { FormField, FormFieldProps, FormFieldType } from '../form-types'
import { useFormTheme } from '../theme-context'
import type { MDXEditorMethods } from '@mdxeditor/editor';

// Import MDXEditor styles - this is the official way per documentation
import '@mdxeditor/editor/style.css'

// --- Extracted Helpers ---

// Default image upload handler for base64 mode
export const defaultImageUploadHandler = (imageUploadMode: string) => async (file: File): Promise<string> => {
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

// Lazy load MDXEditor with basic configuration
const MDXEditor = lazy(() =>
  import('@mdxeditor/editor').then((mod) => {
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

    // Create a simple configured editor
    const SimpleEditor = React.forwardRef<
      MDXEditorMethods,
      {
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
      }
    >(
      (
        {
          value,
          onChange,
          onBlur,
          placeholder,
          readOnly = false,
          className,
          enableImageUpload = false,
          imageUploadHandler,
          maxImageSize = 5 * 1024 * 1024, // 5MB default
          allowedImageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          imageUploadMode = 'base64',
        },
        ref,
      ) => {
        // Default image upload handler for base64 mode
        // Extracted helper functions outside component for shallower nesting
        // See above for defaultImageUploadHandler and handleImageUpload definitions

        // Use custom handler or default
        const handler = imageUploadHandler || defaultImageUploadHandler(imageUploadMode)
        const handleImageUploadWrapper = async (file: File): Promise<string> => handleImageUpload({
          file,
          maxImageSize,
          allowedImageTypes,
          imageUploadHandler: handler,
        })

        const plugins = [
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          ...(enableImageUpload ? [imagePlugin({ imageUploadHandler: handleImageUploadWrapper })] : []),
          markdownShortcutPlugin(),
          ...(readOnly
            ? []
            : [
                toolbarPlugin({
                  toolbarContents: () =>
                    toolbarContents({
                      enableImageUpload,
                      UndoRedo,
                      Separator,
                      BoldItalicUnderlineToggles,
                      CodeToggle,
                      ListsToggle,
                      CreateLink,
                      InsertImage,
                    }),
                }),
              ]),
        ]

        return (
          <MDXEditor
            ref={ref}
            markdown={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            plugins={plugins}
            readOnly={readOnly}
            placeholder={placeholder}
            className={className}
          />
        )
      },
    )

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
