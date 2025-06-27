import React from 'react'
import { render } from '@testing-library/react'
import { Form } from './form'

describe('Form', () => {
  it('renders without crashing', () => {
    render(<Form submit={() => {}} />)
  })
}) 