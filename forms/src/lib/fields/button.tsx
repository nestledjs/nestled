import React from 'react'
import clsx from 'clsx'
import { useFormTheme } from '../theme-context'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    className,
    disabled,
    loading = false,
    fullWidth = false,
    ...props
  }, ref) => {
    // Get the fully resolved theme from the context.
    const theme = useFormTheme()
    const buttonTheme = theme.button

    // Determine the final disabled state.
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={clsx(
          buttonTheme.base,
          buttonTheme[variant],
          isDisabled && buttonTheme.disabled,
          loading && buttonTheme.loading,
          fullWidth && buttonTheme.fullWidth,
          className, // Allow for additional, one-off classes
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? 'Processing...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
