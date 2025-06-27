import type { Meta, StoryObj } from 'storybook/internal/types'
import { RenderFormField } from './render-form-field'
import { expect } from 'storybook/test'

const meta: Meta<typeof RenderFormField> = {
  component: RenderFormField,
  title: 'RenderFormField',
}
export default meta
type Story = StoryObj<typeof RenderFormField>

export const Primary = {
  args: {
    field: '',
    formReadOnly: false,
    formReadOnlyStyle: '',
  },
}

export const Heading: Story = {
  args: {
    field: '',
    formReadOnly: false,
    formReadOnlyStyle: '',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Welcome to RenderFormField!/gi)).toBeTruthy()
  },
}
