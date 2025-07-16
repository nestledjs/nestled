// Shared Storybook test utilities
import { expect, within } from 'storybook/test'

export async function expectLabelToBePresent(canvas: ReturnType<typeof within>, labelText: string) {
  await expect(canvas.getByText(labelText, { selector: 'label' })).toBeInTheDocument()
}

export async function expectLiveFormStateToBePresent(canvas: ReturnType<typeof within>) {
  await expect(canvas.getByText('Live Form State:')).toBeInTheDocument()
}

export {} // Ensure this file is treated as a module for type declarations 