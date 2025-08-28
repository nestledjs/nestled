import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'
import { Button } from './button'

describe('ButtonField Submit Behavior', () => {
  it('should submit form when submit button is clicked without custom onClick', async () => {
    const handleSubmit = vi.fn()
    
    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('username', { label: 'Username', required: true, defaultValue: 'testuser' }),
          FormFieldClass.button('submit', {
            type: 'submit',
            text: 'Submit Form'
          })
        ]}
        submit={handleSubmit}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Submit Form' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ username: 'testuser' })
    })
  })

  it('should call custom onClick and not submit form when onClick is provided', async () => {
    const handleSubmit = vi.fn()
    const handleClick = vi.fn()
    
    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('username', { label: 'Username', defaultValue: 'testuser' }),
          FormFieldClass.button('submit', {
            type: 'submit',
            text: 'Custom Submit',
            onClick: handleClick
          })
        ]}
        submit={handleSubmit}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Custom Submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalled()
      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  it('should submit form with direct Button child', async () => {
    const handleSubmit = vi.fn()
    
    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('username', { label: 'Username', defaultValue: 'testuser' })
        ]}
        submit={handleSubmit}
      >
        <Button type="submit">Direct Submit</Button>
      </Form>
    )

    const submitButton = screen.getByRole('button', { name: 'Direct Submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ username: 'testuser' })
    })
  })

  it('should work with native HTML button', async () => {
    const handleSubmit = vi.fn()
    
    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('email', { label: 'Email', defaultValue: 'test@example.com' })
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Native Submit</button>
      </Form>
    )

    const submitButton = screen.getByRole('button', { name: 'Native Submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })
})