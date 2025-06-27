import type { Meta, StoryObj } from 'storybook/internal/types'
import { Form } from './form'
import { expect } from 'storybook/test'

const meta: Meta<typeof Form> = {
  component: Form,
  title: 'Form',
}
export default meta
type Story = StoryObj<typeof Form>

export const Primary = {
  args: {},
}

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Welcome to Form!/gi)).toBeTruthy()
  },
}
