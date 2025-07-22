import React from 'react'
import { Form } from './form'
import { RenderFormField } from './render-form-field'
import { FormFieldClass } from './form-fields'

/**
 * Test component demonstrating conditional logic with both declarative and imperative APIs
 */
export function TestConditionalLogic() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-6">Conditional Logic Test</h2>
        <p className="text-gray-600 mb-8">
          This demonstrates that conditional logic (showWhen, requiredWhen, disabledWhen) works 
          with both declarative and imperative form APIs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Declarative API Example */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Declarative API (fields array)</h3>
          <Form
            id="declarative-conditional-test"
            fields={[
              FormFieldClass.select('accountType', {
                label: 'Account Type',
                required: true,
                options: [
                  { value: '', label: 'Select type...' },
                  { value: 'personal', label: 'Personal' },
                  { value: 'business', label: 'Business' },
                ],
              }),
              
              FormFieldClass.text('companyName', {
                label: 'Company Name',
                placeholder: 'Enter company name',
                showWhen: (values: any) => values.accountType === 'business',
                requiredWhen: (values: any) => values.accountType === 'business',
              }),
              
              FormFieldClass.checkbox('hasVat', {
                label: 'Has VAT number',
                showWhen: (values: any) => values.accountType === 'business',
              }),
              
              FormFieldClass.text('vatNumber', {
                label: 'VAT Number',
                placeholder: 'Enter VAT number',
                showWhen: (values: any) => values.accountType === 'business' && values.hasVat,
                requiredWhen: (values: any) => values.accountType === 'business' && values.hasVat,
              }),
              
              FormFieldClass.email('email', {
                label: 'Email',
                required: true,
                placeholder: 'Enter email',
                disabledWhen: (values: any) => values.accountType === 'business' && !values.companyName,
              }),
            ]}
                         submit={(values: any) => {
               console.log('Declarative form submitted:', values)
               alert('Declarative form submitted! Check console.')
             }}
          >
            <button 
              type="submit" 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Declarative Form
            </button>
          </Form>
        </div>

        {/* Imperative API Example */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Imperative API (children)</h3>
          <Form
            id="imperative-conditional-test"
                         submit={(values: any) => {
               console.log('Imperative form submitted:', values)
               alert('Imperative form submitted! Check console.')
             }}
          >
            <RenderFormField 
              field={FormFieldClass.select('membershipType', {
                label: 'Membership Type',
                required: true,
                options: [
                  { value: '', label: 'Select membership...' },
                  { value: 'basic', label: 'Basic' },
                  { value: 'premium', label: 'Premium' },
                  { value: 'enterprise', label: 'Enterprise' },
                ],
              })} 
            />
            
            <RenderFormField 
              field={FormFieldClass.text('organizationName', {
                label: 'Organization Name',
                placeholder: 'Enter organization name',
                showWhen: (values: any) => values.membershipType === 'enterprise',
                requiredWhen: (values: any) => values.membershipType === 'enterprise',
              })} 
            />
            
            <RenderFormField 
              field={FormFieldClass.number('userCount', {
                label: 'Number of Users',
                placeholder: 'Enter user count',
                showWhen: (values: any) => ['premium', 'enterprise'].includes(values.membershipType),
                requiredWhen: (values: any) => values.membershipType === 'enterprise',
              })} 
            />
            
            <RenderFormField 
              field={FormFieldClass.checkbox('dedicatedSupport', {
                label: 'Dedicated Support',
                showWhen: (values: any) => values.membershipType === 'enterprise',
              })} 
            />
            
            <RenderFormField 
              field={FormFieldClass.text('supportContact', {
                label: 'Support Contact',
                placeholder: 'Enter support contact',
                showWhen: (values: any) => values.membershipType === 'enterprise' && values.dedicatedSupport,
                requiredWhen: (values: any) => values.membershipType === 'enterprise' && values.dedicatedSupport,
              })} 
            />
            
            <RenderFormField 
              field={FormFieldClass.email('contactEmail', {
                label: 'Contact Email',
                required: true,
                placeholder: 'Enter email',
                disabledWhen: (values: any) => values.membershipType === 'enterprise' && !values.organizationName,
              })} 
            />
            
            <button 
              type="submit" 
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Imperative Form
            </button>
          </Form>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Instructions</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Declarative form:</strong> Select "Business" to see company fields appear</li>
          <li><strong>Imperative form:</strong> Select "Enterprise" to see organization fields appear</li>
          <li>Notice how fields appear/disappear and become required dynamically</li>
          <li>Try submitting forms to see validation work with conditional fields</li>
          <li>Both forms use the same conditional logic system despite different APIs</li>
        </ul>
      </div>
    </div>
  )
} 