import React from 'react';
import clsx from 'clsx';
import { useFormTheme } from '../theme-context'; // Assuming your theme has a label section

interface FormLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
}

export function FormLabel({ htmlFor, label, required }: FormLabelProps) {
  const theme = useFormTheme();

  return (
    <label htmlFor={htmlFor} className={clsx(theme.label.base)}>
      {label}
      {required && (
        // Encapsulate the "required" indicator styling here too
        <span className={clsx(theme.label.requiredIndicator)}> *</span>
      )}
    </label>
  );
}