import { SearchSelectOption } from '../form-types'

// Selected items component for multi-select
export function SelectedItems({
  value,
  onChange,
  theme,
}: {
  value: SearchSelectOption[]
  onChange: (items: SearchSelectOption[]) => void
  theme: any
}) {
  return (
    <>
      {value.map((item: SearchSelectOption) => (
        <span key={item.value} className={theme.selectedItem}>
          <span className={theme.selectedItemLabel}>{item.label}</span>
          <button
            type="button"
            className={theme.selectedItemRemoveButton}
            onClick={() => onChange(value.filter((v: SearchSelectOption) => v.value !== item.value))}
          >
            <svg
              className={theme.selectedItemRemoveIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </>
  )
}

// Display value functions
export function singleSelectDisplayValue(value: SearchSelectOption | null): string {
  return value?.label ?? ''
}

export function multiSelectDisplayValue(value: SearchSelectOption[]): string {
  return Array.isArray(value) ? value.map((v: any) => v.label ?? v).join(', ') : ''
}

// Option mapping functions
export function defaultOptionsMap<TDataItem extends { id: string; name?: string; firstName?: string; lastName?: string }>(
  items: TDataItem[],
): SearchSelectOption[] {
  return items.map((option) => ({
    value: `${option.id}`,
    label: option.name ?? `${option.firstName} ${option.lastName}`,
  }))
}

// Custom placeholder logic
export function getPlaceholder(
  field: any,
  selectedCount = 0,
  isMulti = false
): string {
  if (isMulti && selectedCount > 0) {
    return ''
  }
  return field.options.placeholder || field.options.label
} 