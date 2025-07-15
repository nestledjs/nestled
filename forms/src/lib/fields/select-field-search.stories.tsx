import type { Meta, StoryObj } from '@storybook/react'
import { SelectFieldSearch } from './select-field-search'
import { FormFieldType, FormField } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'

const meta: Meta<typeof SelectFieldSearch> = {
  title: 'Forms/SelectFieldSearch',
  component: SelectFieldSearch,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SelectFieldSearch>

// Mock options for stories
const users = [
  { value: '1', label: 'John Doe' },
  { value: '2', label: 'Jane Smith' },
  { value: '3', label: 'Bob Johnson' },
  { value: '4', label: 'Alice Brown' },
  { value: '5', label: 'Charlie Wilson' },
]

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
]

export const Default: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'user',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Select User',
          options: users,
          placeholder: 'Search users...',
          defaultValue: null,
        },
      }}
    />
  ),
}

export const WithDefaultValue: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'assignee',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Assignee',
          options: users,
          placeholder: 'Search users...',
          defaultValue: '2',
        },
      }}
    />
  ),
}

export const Required: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'country',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Country',
          options: countries,
          placeholder: 'Select your country...',
          defaultValue: null,
          required: true,
        },
      }}
      hasError={true}
    />
  ),
}

export const Disabled: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'lockedUser',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Locked Selection',
          options: users,
          defaultValue: '3',
          disabled: true,
        },
      }}
    />
  ),
}

export const ReadOnly: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'readOnlyUser',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'Read Only User',
          options: users,
          defaultValue: '4',
          readOnly: true,
        },
      }}
    />
  ),
}

export const LargeOptionSet: Story = {
  render: () => {
    const largeOptions = Array.from({ length: 50 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i + 1}`
    }))
    
    return (
      <StorybookFieldWrapper
        field={{
          key: 'largeSet',
          type: FormFieldType.SearchSelect,
          options: {
            label: 'Large Option Set',
            options: largeOptions,
            placeholder: 'Search through 50 options...',
            defaultValue: null,
          },
        }}
      />
    )
  },
}

export const EmptyOptions: Story = {
  render: () => (
    <StorybookFieldWrapper
      field={{
        key: 'empty',
        type: FormFieldType.SearchSelect,
        options: {
          label: 'No Options',
          options: [],
          placeholder: 'No options available...',
          defaultValue: null,
        },
      }}
    />
  ),
} 