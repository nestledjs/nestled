import React from 'react'
import { Form } from './src/lib/form'
import { FormFieldClass } from './src/lib/form-fields'
import { Button } from './src/lib/fields/button'
import { RenderFormField } from './src/lib/render-form-field'

// Example 1: Using Button field in fields array (may have issues)
export function FormWithButtonField() {
  return (
    <Form
      id="form-with-button-field"
      fields={[
        FormFieldClass.text('username', { label: 'Username', required: true }),
        FormFieldClass.email('email', { label: 'Email', required: true }),
        // This button should submit but might not work due to onClick handling
        FormFieldClass.button('submit', {
          text: 'Submit',
          type: 'submit',
          variant: 'primary'
        })
      ]}
      submit={(values) => {
        console.log('Form submitted with values:', values)
      }}
    />
  )
}

// Example 2: Using Button component directly as child (RECOMMENDED)
export function FormWithDirectButton() {
  return (
    <Form
      id="form-with-direct-button"
      fields={[
        FormFieldClass.text('username', { label: 'Username', required: true }),
        FormFieldClass.email('email', { label: 'Email', required: true })
      ]}
      submit={(values) => {
        console.log('Form submitted with values:', values)
      }}
    >
      {/* This is the recommended way - Button as a direct child */}
      <Button type="submit" variant="primary">
        Submit Form
      </Button>
    </Form>
  )
}

// Example 3: Mixed approach with imperative fields
export function FormMixedApproach() {
  return (
    <Form
      id="form-mixed"
      submit={(values) => {
        console.log('Form submitted with values:', values)
      }}
    >
      <RenderFormField field={FormFieldClass.text('username', { label: 'Username', required: true })} />
      <RenderFormField field={FormFieldClass.email('email', { label: 'Email', required: true })} />
      
      {/* Submit button as direct child */}
      <Button type="submit" variant="primary">
        Submit
      </Button>
    </Form>
  )
}

// Example 4: Native HTML button (also works)
export function FormWithNativeButton() {
  return (
    <Form
      id="form-native-button"
      fields={[
        FormFieldClass.text('username', { label: 'Username', required: true }),
        FormFieldClass.email('email', { label: 'Email', required: true })
      ]}
      submit={(values) => {
        console.log('Form submitted with values:', values)
      }}
    >
      {/* Even a native button works */}
      <button type="submit">
        Submit with Native Button
      </button>
    </Form>
  )
}