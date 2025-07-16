import type { Meta, StoryObj } from '@storybook/react'
import { FormFieldType, SelectOptions } from '../form-types'
import { StorybookFieldWrapper } from '../../../.storybook/StorybookFieldWrapper'
import { expect, within, userEvent, waitFor } from 'storybook/test'
import { skills, colors, features, interests, basicOptions } from './storyOptions'

// Helper function to generate realistic usage code with memoization
const codeCache = new Map<string, string>()

// Option sets now imported from storyOptions.ts

// Helper function to build field options array
const buildFieldOptions = (args: SelectFieldMultiStoryArgs): string[] => {
  const options: string[] = []
  
  if (args.label !== 'Multi Select Field') {
    options.push(`label: '${args.label}'`)
  }
  if (args.required) options.push('required: true')
  if (args.disabled) options.push('disabled: true')
  if (args.defaultValue && args.defaultValue.length > 0) {
    const quotedValues = args.defaultValue.map(v => "'" + v + "'")
    const defaultValueArray = '[' + quotedValues.join(', ') + ']'
    options.push(`defaultValue: ${defaultValueArray}`)
  }
  if (args.readOnly) options.push('readOnly: true')
  if (args.readOnlyStyle !== 'value') options.push(`readOnlyStyle: '${args.readOnlyStyle}'`)
  if (args.placeholder && args.placeholder !== 'Select multiple options...') {
    options.push(`placeholder: '${args.placeholder}'`)
  }
  if (args.helpText) options.push(`helpText: '${args.helpText}'`)
  
  return options
}

// Helper function to format options array as string
const formatOptionsArray = (optionSet: 'basic' | 'skills' | 'colors' | 'features' | 'interests'): string => {
  const optionSets = {
    basic: basicOptions,
    skills,
    colors,
    features,
    interests,
  }
  
  const options = optionSets[optionSet]
  const formattedOptions = options.map(
    option => `          { label: '${option.label}', value: '${option.value}' }`
  ).join(',\n')
  
  return `[\n${formattedOptions},\n        ]`
}

// Helper function to build form props
const buildFormProps = (args: SelectFieldMultiStoryArgs): string[] => {
  const formProps: string[] = []
  if (args.formReadOnly) formProps.push('readOnly={true}')
  if (args.formReadOnlyStyle !== 'value') formProps.push(`readOnlyStyle="${args.formReadOnlyStyle}"`)
  return formProps
}

// Helper function to assemble the final code string
const assembleCodeString = (
  fieldOptions: string[],
  optionsArray: string,
  formProps: string[]
): string => {
  const options = [...fieldOptions, `options: ${optionsArray}`]
  
  let optionsString = ''
  if (options.length > 0) {
    optionsString = `
        ${options.join(',\n        ')},`
  }
  
  let formPropsString = ''
  if (formProps.length > 0) {
    formPropsString = `\n  ${formProps.join('\n  ')}`
  }
  
  return `<Form
  id="example-form"${formPropsString}
  fields={[
    {
      key: 'userSelections',
      type: FormFieldType.MultiSelect,
      options: {${optionsString}
      },
    },
  ]}
  submit={(values) => console.log(values)}
/>`
}

const generateSelectFieldMultiCode = (args: SelectFieldMultiStoryArgs): string => {
  const cacheKey = JSON.stringify(args)
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!
  }
  
  const fieldOptions = buildFieldOptions(args)
  const optionsArray = formatOptionsArray(args.optionSet)
  const formProps = buildFormProps(args)
  const code = assembleCodeString(fieldOptions, optionsArray, formProps)
  
  codeCache.set(cacheKey, code)
  return code
}

// Define the flat controls for the Storybook UI
interface SelectFieldMultiStoryArgs {
  label: string
  required: boolean
  disabled: boolean
  defaultValue: string[]
  readOnly: boolean
  readOnlyStyle: 'value' | 'disabled'
  hasError: boolean
  errorMessage: string
  placeholder: string
  helpText: string
  optionSet: 'basic' | 'skills' | 'colors' | 'features' | 'interests'
  formReadOnly: boolean
  formReadOnlyStyle: 'value' | 'disabled'
  showState: boolean
}

/**
 * The SelectFieldMulti component provides a multi-selection dropdown interface with removable tags.
 * Users can select multiple options from a dropdown list, with selected items displayed as
 * removable chips/badges above the input. Perfect for tags, skills, categories, and other
 * multi-value selections where the relationship between items doesn't require a specific order.
 */
const meta: Meta<SelectFieldMultiStoryArgs> = {
  title: 'Forms/SelectFieldMulti',
  tags: ['autodocs'],
  parameters: {
    docs: {
      source: {
        type: 'code',
        transform: (code: string, storyContext: any) => {
          return generateSelectFieldMultiCode(storyContext.args)
        },
      },
      story: {
        inline: true,
        autoplay: false,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Field label' },
    required: { control: 'boolean', description: 'Is required?' },
    disabled: { control: 'boolean', description: 'Is disabled?' },
    defaultValue: { 
      control: 'object', 
      description: 'Array of default selected values',
      table: { type: { summary: 'string[]' } }
    },
    readOnly: { control: 'boolean', description: 'Is read-only?' },
    readOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Read-only display style',
    },
    hasError: { control: 'boolean', description: 'Show error state?' },
    errorMessage: { control: 'text', description: 'Error message' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    helpText: { control: 'text', description: 'Help text' },
    optionSet: {
      control: 'select',
      options: ['basic', 'skills', 'colors', 'features', 'interests'],
      description: 'Set of options to display',
    },
    formReadOnly: { control: 'boolean', description: 'Form-wide read-only?' },
    formReadOnlyStyle: {
      control: 'radio',
      options: ['value', 'disabled'],
      description: 'Form-wide read-only style',
    },
    showState: { control: 'boolean', description: 'Show live form state?' },
  },
  args: {
    label: 'Multi Select Field',
    required: false,
    disabled: false,
    defaultValue: [],
    readOnly: false,
    readOnlyStyle: 'value',
    hasError: false,
    errorMessage: 'Please select at least one option.',
    placeholder: 'Select multiple options...',
    helpText: '',
    optionSet: 'basic',
    formReadOnly: false,
    formReadOnlyStyle: 'value',
    showState: true,
  },
  render: (args) => {
    // Generate different option sets based on the selected optionSet
    const optionSets = {
      basic: [
        { label: 'Option One', value: 'option-1' },
        { label: 'Option Two', value: 'option-2' },
        { label: 'Option Three', value: 'option-3' },
        { label: 'Option Four', value: 'option-4' },
        { label: 'Option Five', value: 'option-5' },
      ],
      skills: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'React', value: 'react' },
        { label: 'Vue.js', value: 'vue' },
        { label: 'Angular', value: 'angular' },
        { label: 'Node.js', value: 'nodejs' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'PHP', value: 'php' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
        { label: 'Swift', value: 'swift' },
        { label: 'Kotlin', value: 'kotlin' },
        { label: 'Ruby', value: 'ruby' },
      ],
      colors: [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
        { label: 'Green', value: 'green' },
        { label: 'Yellow', value: 'yellow' },
        { label: 'Purple', value: 'purple' },
        { label: 'Orange', value: 'orange' },
        { label: 'Pink', value: 'pink' },
        { label: 'Brown', value: 'brown' },
        { label: 'Black', value: 'black' },
        { label: 'White', value: 'white' },
        { label: 'Gray', value: 'gray' },
        { label: 'Cyan', value: 'cyan' },
      ],
      features: [
        { label: 'Dark Mode', value: 'dark-mode' },
        { label: 'Push Notifications', value: 'push-notifications' },
        { label: 'Offline Support', value: 'offline-support' },
        { label: 'Real-time Updates', value: 'real-time-updates' },
        { label: 'Data Export', value: 'data-export' },
        { label: 'Advanced Search', value: 'advanced-search' },
        { label: 'Custom Themes', value: 'custom-themes' },
        { label: 'API Access', value: 'api-access' },
        { label: 'Two-Factor Auth', value: 'two-factor-auth' },
        { label: 'Single Sign-On', value: 'sso' },
      ],
      interests: [
        { label: 'Sports', value: 'sports' },
        { label: 'Music', value: 'music' },
        { label: 'Movies', value: 'movies' },
        { label: 'Books', value: 'books' },
        { label: 'Travel', value: 'travel' },
        { label: 'Cooking', value: 'cooking' },
        { label: 'Photography', value: 'photography' },
        { label: 'Gaming', value: 'gaming' },
        { label: 'Art', value: 'art' },
        { label: 'Technology', value: 'technology' },
        { label: 'Fitness', value: 'fitness' },
        { label: 'Fashion', value: 'fashion' },
      ],
    }

    // Build field options conditionally
    const fieldOptions: SelectOptions = {
      label: args.label,
      required: args.required,
      disabled: args.disabled,
      defaultValue: args.defaultValue,
      placeholder: args.placeholder,
      options: optionSets[args.optionSet],
    }

    // Only set field-level readOnly if it's explicitly true, otherwise let form-level take precedence
    if (args.readOnly) {
      fieldOptions.readOnly = args.readOnly
    }
    
    if (args.readOnly && args.readOnlyStyle !== 'value') {
      fieldOptions.readOnlyStyle = args.readOnlyStyle
    }
    
    if (args.helpText) {
      fieldOptions.helpText = args.helpText
    }

    const field: { key: string; type: FormFieldType.MultiSelect; options: SelectOptions } = {
      key: 'storybookMultiSelectField',
      type: FormFieldType.MultiSelect,
      options: fieldOptions,
    }
    return (
      <StorybookFieldWrapper
        field={field}
        hasError={args.hasError}
        errorMessage={args.errorMessage}
        formReadOnly={args.formReadOnly}
        formReadOnlyStyle={args.formReadOnlyStyle}
        showState={args.showState}
      />
    )
  },
}

export default meta
type Story = StoryObj<SelectFieldMultiStoryArgs>

/**
 * The default MultiSelect with basic options.
 */
export const Default: Story = {}

/**
 * A MultiSelect with pre-selected values demonstrating the selected items display.
 */
export const WithDefaultValues: Story = {
  args: {
    label: 'Programming Skills',
    optionSet: 'skills',
    defaultValue: ['javascript', 'react', 'typescript'],
    helpText: 'Select all programming languages and frameworks you know',
  },
}

/**
 * A required MultiSelect field.
 */
export const Required: Story = {
  args: {
    label: 'Favorite Colors',
    optionSet: 'colors',
    required: true,
    placeholder: 'Choose your favorite colors...',
    helpText: 'Select at least one color',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify required indicator is shown', async () => {
      const label = canvas.getByText('Favorite Colors')
      expect(label).toBeInTheDocument()
    })
  },
}

/**
 * A MultiSelect in an error state.
 */
export const WithError: Story = {
  args: {
    label: 'Required Features',
    optionSet: 'features',
    hasError: true,
    errorMessage: 'Please select at least one feature',
    required: true,
    placeholder: 'Select features...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify error state is displayed', async () => {
      const errorMessage = canvas.getByText('Please select at least one feature')
      expect(errorMessage).toBeInTheDocument()
    })
  },
}

/**
 * A disabled MultiSelect that cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Multi-Selection',
    disabled: true,
    defaultValue: ['option-1', 'option-3'],
    placeholder: 'This field is disabled',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    
    await step('Verify field is disabled', async () => {
      const input = canvas.getByRole('combobox')
      expect(input).toBeDisabled()
    })
  },
}

/**
 * A MultiSelect in read-only mode showing only the values.
 */
export const ReadOnlyValue: Story = {
  args: {
    label: 'Selected Interests',
    optionSet: 'interests',
    defaultValue: ['music', 'travel', 'photography'],
    readOnly: true,
    readOnlyStyle: 'value',
  },
}

/**
 * A MultiSelect in read-only mode showing as a disabled input.
 */
export const ReadOnlyDisabled: Story = {
  args: {
    label: 'Selected Skills',
    optionSet: 'skills',
    defaultValue: ['javascript', 'react', 'nodejs'],
    readOnly: true,
    readOnlyStyle: 'disabled',
  },
}

/**
 * A MultiSelect with form-level read-only mode.
 */
export const FormReadOnly: Story = {
  args: {
    label: 'Form Read-Only',
    optionSet: 'colors',
    defaultValue: ['blue', 'green'],
    formReadOnly: true,
    formReadOnlyStyle: 'value',
  },
}

/**
 * Interactive test demonstrating multi-selection functionality.
 */
export const MultiSelection: Story = {
  args: {
    label: 'Multi-Selection Test',
    optionSet: 'colors',
    placeholder: 'Select multiple colors...',
    helpText: 'This story tests multi-selection interactions',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Open dropdown and select first option', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      
      // Wait for options to appear
      const redOption = await canvas.findByText('Red')
      expect(redOption).toBeInTheDocument()
      
      await user.click(redOption)
      
      // Should see selected item in tags container only
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('Red')).toBeInTheDocument()
      // Optionally, close the dropdown and assert only one 'Red' is present
      await user.click(document.body)
      const allRed = canvas.getAllByText('Red')
      expect(allRed).toHaveLength(1)
    })
    
    await step('Select additional options', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      
      const blueOption = canvas.getByText('Blue')
      await user.click(blueOption)
      
      // Both items should be selected in tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('Red')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('Blue')).toBeInTheDocument()
      // Optionally, close the dropdown and assert only one of each
      await user.click(document.body)
      expect(canvas.getAllByText('Red')).toHaveLength(1)
      expect(canvas.getAllByText('Blue')).toHaveLength(1)
    })
    
    await step('Select third option', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      
      const greenOption = canvas.getByText('Green')
      await user.click(greenOption)
      
      // All three items should be selected in tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('Red')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('Blue')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('Green')).toBeInTheDocument()
      // Optionally, close the dropdown and assert only one of each
      await user.click(document.body)
      expect(canvas.getAllByText('Red')).toHaveLength(1)
      expect(canvas.getAllByText('Blue')).toHaveLength(1)
      expect(canvas.getAllByText('Green')).toHaveLength(1)
    })
  },
}

/**
 * Test removing selected items via the remove buttons.
 */
export const RemoveSelectedItems: Story = {
  args: {
    label: 'Remove Items Test',
    optionSet: 'skills',
    defaultValue: ['javascript', 'react', 'typescript'],
    helpText: 'Test removing selected items',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Verify all selected items are displayed', async () => {
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('JavaScript')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('React')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('TypeScript')).toBeInTheDocument()
    })
    
    await step('Remove middle item (React)', async () => {
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      // Find the remove button for React by traversing tags
      const tagSpans = Array.from(tagsContainer.querySelectorAll('span'))
      const reactTag = tagSpans.find(span => span.textContent?.includes('React'))
      const reactRemoveButton = reactTag?.querySelector('button')
      if (reactRemoveButton) {
        await user.click(reactRemoveButton)
        // Wait for React to be removed
        await waitFor(() => {
          expect(within(tagsContainer).queryByText('React')).not.toBeInTheDocument()
        })
        // Others should remain in tags container
        expect(within(tagsContainer).getByText('JavaScript')).toBeInTheDocument()
        expect(within(tagsContainer).getByText('TypeScript')).toBeInTheDocument()
      } else {
        throw new Error('Could not find remove button for React')
      }
    })
  },
}

/**
 * Test keyboard navigation and selection.
 */
export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard Navigation Test',
    optionSet: 'features',
    placeholder: 'Use keyboard to navigate...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Focus and open dropdown with keyboard', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      expect(input).toHaveFocus()
      // Should see options
      await canvas.findByText('Dark Mode')
    })
    
    await step('Navigate and select with keyboard', async () => {
      // Navigate down and select first option (Dark Mode)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      // Should have selected first option in tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('Dark Mode')).toBeInTheDocument()
    })
    
    await step('Select another option with keyboard', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input) // Re-focus input to open dropdown
      // Wait for dropdown to be open and "Push Notifications" to be visible
      await canvas.findByText('Push Notifications')
      // Now navigate to "Push Notifications"
      await user.keyboard('{ArrowDown}') // Should focus "Push Notifications"
      await user.keyboard('{Enter}')
      // Assert both selected items in tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('Dark Mode')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('Push Notifications')).toBeInTheDocument()
    })
  },
}

/**
 * Test form submission with MultiSelect values.
 */
export const FormSubmission: Story = {
  args: {
    label: 'Submit Test',
    optionSet: 'interests',
    required: true,
    showState: true,
    placeholder: 'Select your interests...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Select multiple interests and verify form state', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      
      // Select Sports
      const sportsOption = canvas.getByText('Sports')
      await user.click(sportsOption)
      
      // Select Music
      await user.click(input)
      const musicOption = canvas.getByText('Music')
      await user.click(musicOption)
      
      // Check that the values appear in the live form state as an array
      const stateDisplay = canvas.getByText(/"storybookMultiSelectField": \[/)
      expect(stateDisplay).toBeInTheDocument()
      
      // Should contain both selected values
      expect(canvas.getByText(/sports/)).toBeInTheDocument()
      expect(canvas.getByText(/music/)).toBeInTheDocument()
    })
  },
}

/**
 * Test with large option sets and many selections.
 */
export const LargeDataset: Story = {
  args: {
    label: 'Technical Skills',
    optionSet: 'skills',
    placeholder: 'Select all your programming skills...',
    helpText: 'Choose all languages and frameworks you are comfortable with',
    defaultValue: ['javascript', 'typescript', 'react'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Verify pre-selected skills are displayed', async () => {
      expect(canvas.getByText('JavaScript')).toBeInTheDocument()
      expect(canvas.getByText('TypeScript')).toBeInTheDocument()
      expect(canvas.getByText('React')).toBeInTheDocument()
    })
    
    await step('Verify large dataset options and initial selection', async () => {
      const input = canvas.getByRole('combobox')
      await user.click(input)
      
      // Should see many options in the dropdown
      expect(canvas.getByText('Python')).toBeInTheDocument()
      expect(canvas.getByText('Node.js')).toBeInTheDocument()
      expect(canvas.getByText('Java')).toBeInTheDocument()
      
      // Verify the initial 3 selected skills in tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      expect(within(tagsContainer).getByText('JavaScript')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('TypeScript')).toBeInTheDocument()
      expect(within(tagsContainer).getByText('React')).toBeInTheDocument()
    })
  },
}

/**
 * Test edge case of selecting and deselecting all options.
 */
export const SelectDeselectAll: Story = {
  args: {
    label: 'Select/Deselect All Test',
    optionSet: 'colors',
    helpText: 'Test selecting many options and removing them',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    
    await step('Select multiple options quickly', async () => {
      const input = canvas.getByRole('combobox')
      // Select several colors
      const colorsToSelect = ['Red', 'Blue', 'Green', 'Yellow']
      for (const color of colorsToSelect) {
        await user.click(input)
        const option = canvas.getByText(color)
        await user.click(option)
      }
      // Verify all are selected in the tags container
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      for (const color of colorsToSelect) {
        expect(within(tagsContainer).getByText(color)).toBeInTheDocument()
      }
    })
    
    await step('Remove all selected items', async () => {
      const tagsContainer = canvas.getByRole('combobox').closest('[class*="flex-wrap"]') as HTMLElement
      const colorsToRemove = ['Red', 'Blue', 'Green', 'Yellow']
      for (const color of colorsToRemove) {
        // Re-query the tag span for this color
        const tagSpans = Array.from(tagsContainer.querySelectorAll('span'))
        const tag = tagSpans.find(span => span.textContent?.trim() === color)
        if (tag) {
          const removeButton = tag.querySelector('button')
          if (removeButton) {
            await user.click(removeButton)
            // Wait for the tag to be removed
            await waitFor(() => {
              expect(within(tagsContainer).queryByText(color)).not.toBeInTheDocument()
            })
          } else {
            throw new Error(`Could not find remove button for ${color}`)
          }
        } else {
          throw new Error(`Could not find tag for ${color}`)
        }
      }
      // Final assertion: none of the tags should be present
      colorsToRemove.forEach(color => {
        expect(within(tagsContainer).queryByText(color)).not.toBeInTheDocument()
      })
    })
  },
} 