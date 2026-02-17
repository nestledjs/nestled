import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Form } from '../form'
import { FormFieldClass } from '../form-fields'

describe('PhoneField Validation', () => {
  it('should accept valid US phone numbers', async () => {
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '+12125551234',
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ phone: '+12125551234' })
    })
  })

  it('should allow empty values when field is not required', async () => {
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  it('should reject invalid phone numbers on submit', async () => {
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '123',
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
    })
  })

  it('should require phone when required is set', async () => {
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
            required: true,
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  it('should use custom validate function when provided', async () => {
    const handleSubmit = vi.fn()
    const customValidate = vi.fn().mockReturnValue('Custom error')

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '+12125551234',
            validate: customValidate,
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(customValidate).toHaveBeenCalled()
      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })
})

describe('PhoneField validation survives RenderFormField lifecycle', () => {
  it('should retain phone validation after RenderFormField processes the field', async () => {
    // This is the core regression test: the previous bug caused RenderFormField's
    // useEffect to re-register the field with only { required }, stripping the
    // phone validate function. This test ensures that doesn't happen.
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '123', // Invalid phone number
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    // Wait for any effects/re-renders to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Now try to submit - validation should still reject the invalid number
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    // Error message should be present
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
    })
  })

  it('should retain phone validation even with requiredWhen conditional', async () => {
    // Tests that phone validation survives dynamic required state changes
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('trigger', {
            label: 'Trigger',
            defaultValue: 'yes',
          }),
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '123', // Invalid
            requiredWhen: (values: any) => values.trigger === 'yes',
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    // Wait for effects to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Submit should fail due to phone validation (not just required)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  it('should work with phone field alongside other field types', async () => {
    const handleSubmit = vi.fn()

    render(
      <Form
        id="test-form"
        fields={[
          FormFieldClass.text('name', {
            label: 'Name',
            required: true,
            defaultValue: 'John',
          }),
          FormFieldClass.phone('phone', {
            label: 'Phone',
            defaultValue: '+12125551234',
          }),
          FormFieldClass.text('email', {
            label: 'Email',
            defaultValue: 'john@example.com',
          }),
        ]}
        submit={handleSubmit}
      >
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John',
        phone: '+12125551234',
        email: 'john@example.com',
      })
    })
  })
})
