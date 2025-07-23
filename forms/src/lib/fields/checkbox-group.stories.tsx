import type { Meta, StoryObj } from '@storybook/react'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'

const meta: Meta<typeof Form> = {
  title: 'Forms/CheckboxGroup',
  tags: ['autodocs'],
  component: Form,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof Form>

export const Basic: Story = {
  args: {
    id: 'checkbox-group-basic',
    fields: [
      FormFieldClass.checkboxGroup('interests', {
        label: 'Interests',
        checkboxOptions: [
          { key: 'sports', value: 'sports', label: 'Sports' },
          { key: 'music', value: 'music', label: 'Music' },
          { key: 'travel', value: 'travel', label: 'Travel' },
          { key: 'technology', value: 'technology', label: 'Technology' },
          { key: 'cooking', value: 'cooking', label: 'Cooking' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const WithDefaultValues: Story = {
  args: {
    id: 'checkbox-group-default',
    fields: [
      FormFieldClass.checkboxGroup('preferences', {
        label: 'Default Preferences',
        defaultValue: 'music,travel',
        checkboxOptions: [
          { key: 'sports', value: 'sports', label: 'Sports' },
          { key: 'music', value: 'music', label: 'Music' },
          { key: 'travel', value: 'travel', label: 'Travel' },
          { key: 'technology', value: 'technology', label: 'Technology' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const Required: Story = {
  args: {
    id: 'checkbox-group-required',
    fields: [
      FormFieldClass.checkboxGroup('requiredInterests', {
        label: 'Required Interests',
        required: true,
        checkboxOptions: [
          { key: 'frontend', value: 'frontend', label: 'Frontend Development' },
          { key: 'backend', value: 'backend', label: 'Backend Development' },
          { key: 'mobile', value: 'mobile', label: 'Mobile Development' },
          { key: 'devops', value: 'devops', label: 'DevOps' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const ColumnLayout: Story = {
  args: {
    id: 'checkbox-group-column',
    fields: [
      FormFieldClass.checkboxGroup('skills', {
        label: 'Skills (Column Layout)',
        checkboxDirection: 'column',
        checkboxOptions: [
          { key: 'javascript', value: 'javascript', label: 'JavaScript' },
          { key: 'typescript', value: 'typescript', label: 'TypeScript' },
          { key: 'react', value: 'react', label: 'React' },
          { key: 'node', value: 'node', label: 'Node.js' },
          { key: 'python', value: 'python', label: 'Python' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const RowLayout: Story = {
  args: {
    id: 'checkbox-group-row',
    fields: [
      FormFieldClass.checkboxGroup('availability', {
        label: 'Availability (Row Layout)',
        checkboxDirection: 'row',
        checkboxOptions: [
          { key: 'monday', value: 'monday', label: 'Mon' },
          { key: 'tuesday', value: 'tuesday', label: 'Tue' },
          { key: 'wednesday', value: 'wednesday', label: 'Wed' },
          { key: 'thursday', value: 'thursday', label: 'Thu' },
          { key: 'friday', value: 'friday', label: 'Fri' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const Disabled: Story = {
  args: {
    id: 'checkbox-group-disabled',
    fields: [
      FormFieldClass.checkboxGroup('disabledGroup', {
        label: 'Disabled Checkbox Group',
        disabled: true,
        defaultValue: 'option1,option3',
        checkboxOptions: [
          { key: 'option1', value: 'option1', label: 'Option 1' },
          { key: 'option2', value: 'option2', label: 'Option 2' },
          { key: 'option3', value: 'option3', label: 'Option 3' },
          { key: 'option4', value: 'option4', label: 'Option 4' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const ReadOnlyValue: Story = {
  args: {
    id: 'checkbox-group-readonly-value',
    fields: [
      FormFieldClass.checkboxGroup('readonlyValue', {
        label: 'Read-Only (Value Style)',
        readOnly: true,
        defaultValue: 'hiking,photography,reading',
        checkboxOptions: [
          { key: 'hiking', value: 'hiking', label: 'Hiking' },
          { key: 'photography', value: 'photography', label: 'Photography' },
          { key: 'reading', value: 'reading', label: 'Reading' },
          { key: 'gaming', value: 'gaming', label: 'Gaming' },
          { key: 'art', value: 'art', label: 'Art' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const ReadOnlyDisabled: Story = {
  args: {
    id: 'checkbox-group-readonly-disabled',
    fields: [
      FormFieldClass.checkboxGroup('readonlyDisabled', {
        label: 'Read-Only (Disabled Style)',
        readOnly: true,
        readOnlyStyle: 'disabled',
        defaultValue: 'javascript,react,nodejs',
        checkboxOptions: [
          { key: 'javascript', value: 'javascript', label: 'JavaScript' },
          { key: 'react', value: 'react', label: 'React' },
          { key: 'nodejs', value: 'nodejs', label: 'Node.js' },
          { key: 'vue', value: 'vue', label: 'Vue.js' },
          { key: 'angular', value: 'angular', label: 'Angular' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const WithCustomSeparator: Story = {
  args: {
    id: 'checkbox-group-custom-separator',
    fields: [
      FormFieldClass.checkboxGroup('categories', {
        label: 'Categories (Custom Separator)',
        valueSeparator: '|',
        defaultValue: 'fiction|mystery',
        checkboxOptions: [
          { key: 'fiction', value: 'fiction', label: 'Fiction' },
          { key: 'mystery', value: 'mystery', label: 'Mystery' },
          { key: 'biography', value: 'biography', label: 'Biography' },
          { key: 'science', value: 'science', label: 'Science' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const WithHiddenOptions: Story = {
  args: {
    id: 'checkbox-group-hidden',
    fields: [
      FormFieldClass.checkboxGroup('visibleOptions', {
        label: 'Visible Options Only',
        checkboxOptions: [
          { key: 'visible1', value: 'visible1', label: 'Visible Option 1' },
          { key: 'hidden1', value: 'hidden1', label: 'Hidden Option', hidden: true },
          { key: 'visible2', value: 'visible2', label: 'Visible Option 2' },
          { key: 'visible3', value: 'visible3', label: 'Visible Option 3' },
          { key: 'hidden2', value: 'hidden2', label: 'Another Hidden', hidden: true },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const FullWidthLabels: Story = {
  args: {
    id: 'checkbox-group-full-width',
    fields: [
      FormFieldClass.checkboxGroup('fullWidth', {
        label: 'Full Width Labels',
        fullWidthLabel: true,
        checkboxDirection: 'column',
        checkboxOptions: [
          { key: 'option1', value: 'option1', label: 'This is a very long label that demonstrates full width' },
          { key: 'option2', value: 'option2', label: 'Another long label to show the layout' },
          { key: 'option3', value: 'option3', label: 'Third option with extended text' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const EmptyReadOnly: Story = {
  args: {
    id: 'checkbox-group-empty-readonly',
    fields: [
      FormFieldClass.checkboxGroup('emptyReadOnly', {
        label: 'No Selection (Read-Only)',
        readOnly: true,
        defaultValue: '',
        checkboxOptions: [
          { key: 'option1', value: 'option1', label: 'Option 1' },
          { key: 'option2', value: 'option2', label: 'Option 2' },
          { key: 'option3', value: 'option3', label: 'Option 3' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}

export const MultipleCheckboxGroups: Story = {
  args: {
    id: 'multiple-checkbox-groups',
    fields: [
      FormFieldClass.checkboxGroup('workExperience', {
        label: 'Work Experience',
        checkboxDirection: 'column',
        checkboxOptions: [
          { key: 'startup', value: 'startup', label: 'Startup' },
          { key: 'corporate', value: 'corporate', label: 'Corporate' },
          { key: 'freelance', value: 'freelance', label: 'Freelance' },
          { key: 'remote', value: 'remote', label: 'Remote Work' },
        ],
      }),
      FormFieldClass.checkboxGroup('frameworks', {
        label: 'Preferred Frameworks',
        checkboxDirection: 'row',
        defaultValue: 'react,vue',
        checkboxOptions: [
          { key: 'react', value: 'react', label: 'React' },
          { key: 'vue', value: 'vue', label: 'Vue' },
          { key: 'angular', value: 'angular', label: 'Angular' },
          { key: 'svelte', value: 'svelte', label: 'Svelte' },
        ],
      }),
    ],
    submit: (values) => console.log('Form submitted:', values),
  },
}
