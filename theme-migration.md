Of course. This is the perfect use case for a detailed, reusable prompt for Cursor. You can feed it this set of instructions along with the code for each component you want to refactor.

Here is the prompt. It includes the context, a clear step-by-step process, and a complete example of refactoring `TextField.tsx` to serve as a perfect template.

---

### **Cursor Prompt: Refactor Form Field to Use Theming System**

**Context:**

You are an expert React developer specializing in creating flexible, theme-based UI libraries. I have refactored my forms library to use a new theming system.

The system works like this:
1.  A `FormTheme` interface is defined in `/src/lib/theme-types.ts`. It describes the "shape" of a theme object, which contains class strings and `ReactNode`s for various component parts and states.
2.  Two default themes are provided: `unstyledTheme` (with empty strings and nulls) and `tailwindTheme` (with pre-defined Tailwind CSS classes and Heroicons).
3.  The main `<Form>` component accepts a `theme` prop. It deep-merges this user-provided theme on top of a base theme (`unstyled` or `tailwind`) and provides the final, merged theme object via a `ThemeContext`.
4.  Component files use a `useFormTheme()` hook to access this theme object.

**Your Task:**

Your task is to refactor a given form field component to be fully driven by this new theming system. You will need to identify all stylable elements and states within the component, define their shape in the theme files, and then update the component to use the theme.

---

**Step-by-Step Refactoring Process:**

**Step 1: Analyze the Component and Identify Theming "Slots"**

*   Examine the JSX of the component.
*   Identify every distinct visual part that needs styling. Examples: `wrapper`, `input`, `label`, `icon`, `handle`, `optionsWrapper`, `optionItem`.
*   For each part, identify its different states. Common states are:
  *   `base`: The default, inactive state.
  *   `error`: When `hasError` is true.
  *   `disabled`: When `field.options.disabled` is true.
  *   `readOnly`: For the `readOnlyStyle: 'disabled'` variant.
  *   Component-specific states (e.g., `on`/`off` for `Switch`, `active`/`selected` for `SelectOption`).
*   Identify any hardcoded icons (like `CheckIcon` or `XMarkIcon`) that should be replaced by a `ReactNode` from the theme.

**Step 2: Update the Theme Definition Files**

1.  **Update `/src/lib/theme-types.ts`:**
  *   Add a new property to the `FormTheme` interface corresponding to the component you are refactoring (e.g., `textField`, `checkboxField`, `switchField`).
  *   Define the shape using the "slots" and states you identified in Step 1.

2.  **Update `/src/lib/themes/unstyled.ts`:**
  *   Add the new property to the `unstyledTheme` object.
  *   Provide empty strings (`''`) for all class name properties and `null` for all `ReactNode` icon properties. This ensures it's truly unstyled by default.

3.  **Update `/src/lib/themes/tailwind.ts`:**
  *   Add the new property to the `tailwindTheme` object.
  *   **Extract** the existing `clsx` class strings from the component file and place them into the corresponding properties of your new theme definition. This is the "default" Tailwind look.
  *   For icons, import them from `@heroicons/...` and place the JSX `<CheckIcon ... />` directly in the theme object.

**Step 3: Refactor the Component File**

1.  **Import and Use the Theme:**
  *   At the top of the file, add `import { useFormTheme } from '../theme-context'`.
  *   Inside the component function, call `const theme = useFormTheme()`.

2.  **Apply Theme Classes:**
  *   Go through the JSX and replace all hardcoded class strings and `clsx()` calls.
  *   The new `className` prop should be a `clsx()` call that pulls strings from the theme object. For example: `className={clsx(theme.input.base, hasError && theme.input.error)}`.

3.  **Apply Theme Icons:**
  *   Where you previously rendered a hardcoded icon component, now render the `ReactNode` from the theme. For example: `return value ? theme.checkbox.icons.checked : theme.checkbox.icons.unchecked;`

4.  **Clean Up:**
  *   Remove any unused imports (like old icon imports or `inputStyle`).

---

### **Example: Refactoring `TextField.tsx`**

**1. Analyze:**
*   **Slots:** The component is just a single `<input>`. I'll call this slot `input`.
*   **States:** It has `base` styles, `error` styles, and `disabled` styles. The `readOnly` state (disabled variant) also uses the same input.
*   **Icons:** None.

**2. Update Theme Files:**

*   **/src/lib/theme-types.ts**
    ```typescript
    // ... inside FormTheme interface
    input: {
      base: string;
      error: string;
    };
    ```

*   **/src/lib/themes/unstyled.ts**
    ```typescript
    // ... inside unstyledTheme object
    input: {
      base: '',
      error: '',
    },
    ```

*   **/src/lib/themes/tailwind.ts**
    ```typescript
    // ... inside tailwindTheme object
    input: {
      base: 'appearance-none block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100',
      error: '!border-red-600 !focus:border-red-600',
    },
    ```

**3. Refactor Component (`text-field.tsx`):**

*   **Before:**
    ```typescript
    import clsx from 'clsx'
    import { FormField, FormFieldProps, FormFieldType } from '../form-types'
    import { inputStyle } from '../styles/input-style'

    export function TextField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: ...) {
      // ... readOnly logic
      if (isReadOnly) {
        // ...
        return (
          <input
            // ...
            className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
            // ...
          />
        );
      }

      return (
        <input
          // ...
          {...form.register(field.key, { required: field.options.required })}
          className={clsx(inputStyle, hasError && '!border-red-600 !focus:border-red-600')}
        />
      )
    }
    ```

*   **After:**
    ```typescript
    import clsx from 'clsx'
    import { FormField, FormFieldProps, FormFieldType } from '../form-types'
    import { useFormTheme } from '../theme-context' // Step 3.1

    export function TextField({ form, field, hasError, formReadOnly = false, formReadOnlyStyle = 'value' }: ...) {
      const theme = useFormTheme() // Step 3.1
      const isReadOnly = field.options.readOnly ?? formReadOnly;
      const readOnlyStyle = field.options.readOnlyStyle ?? formReadOnlyStyle;
      const value = form.getValues(field.key) ?? '';

      if (isReadOnly) {
        if (readOnlyStyle === 'disabled') {
          return (
            <input
              id={field.key}
              type="text"
              disabled={true}
              value={value}
              className={clsx(theme.input.base, hasError && theme.input.error)} // Step 3.2
            />
          );
        }
        return <div className="min-h-[2.5rem] flex items-center px-3 text-gray-700">{value ?? '—'}</div>;
      }

      return (
        <input
          id={field.key}
          type="text"
          disabled={field.options.disabled}
          autoComplete="true"
          placeholder={field.options.placeholder}
          defaultValue={field.options.defaultValue}
          {...form.register(field.key, { required: field.options.required })}
          className={clsx(theme.input.base, hasError && theme.input.error)} // Step 3.2
        />
      )
    }
    ```

---

Now, apply this refactoring process to the following file(s):
