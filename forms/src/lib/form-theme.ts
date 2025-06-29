import { z } from 'zod';

export const FormThemeSchema = z.object({
  global: z.object({
    input: z.string().default(''),
    error: z.string().default(''),
    disabled: z.string().default(''),
    readOnly: z.string().default(''),
  }).default({}),
  label: z.object({
    base: z.string().default(''),
    requiredIndicator: z.string().default(''),
  }).default({}),
  textField: z.object({
    input: z.string().default(''),
    error: z.string().default(''),
    disabled: z.string().default(''),
    readOnly: z.string().default(''),
  }).default({}),
  checkbox: z.object({
    wrapper: z.string().default(''),
    row: z.string().default(''),
    rowFullWidth: z.string().default(''),
    input: z.string().default(''),
    error: z.string().default(''),
    disabled: z.string().default(''),
    label: z.string().default(''),
    fullWidthLabel: z.string().default(''),
    helpText: z.string().default(''),
    errorText: z.string().default(''),
    readonlyCheckedIcon: z.any().optional(),
    readonlyUncheckedIcon: z.any().optional(),
  }).default({}),
  button: z.object({
    base: z.string().default(''),
    primary: z.string().default(''),
    secondary: z.string().default(''),
    danger: z.string().default(''),
    disabled: z.string().default(''),
    loading: z.string().default(''),
  }).default({}),
  // Add more fields as needed
});

export type FormTheme = z.infer<typeof FormThemeSchema>;
