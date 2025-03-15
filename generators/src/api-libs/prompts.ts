import { ApiLibGeneratorSchema } from './schema'
import { prompt } from 'enquirer'

type PromptDefinition = {
  type: 'confirm' | 'input'
  name: string
  message: string
  default?: boolean | string
  skip?: (answers: Partial<ApiLibGeneratorSchema>) => boolean
}

const defaultOptions: Partial<ApiLibGeneratorSchema> = {
  generateAccounts: true,
  generateAuth: true,
  generateCore: true,
  generateMailer: true,
  generateUser: true,
}

const prompts: PromptDefinition[] = [
  {
    type: 'confirm',
    name: 'useDefaults',
    message: 'Generate all library modules? (Accounts, Auth, Core, Mailer, User)',
    default: false,
  },
  {
    type: 'confirm',
    name: 'generateAccounts',
    message: 'Generate Accounts module?',
    default: true,
    skip: (answers) => answers.useDefaults === true,
  },
  {
    type: 'confirm',
    name: 'generateAuth',
    message: 'Generate Auth module?',
    default: true,
    skip: (answers) => answers.useDefaults === true,
  },
  {
    type: 'confirm',
    name: 'generateCore',
    message: 'Generate Core module?',
    default: true,
    skip: (answers) => answers.useDefaults === true,
  },
  {
    type: 'confirm',
    name: 'generateMailer',
    message: 'Generate Mailer module?',
    default: true,
    skip: (answers) => answers.useDefaults === true,
  },
  {
    type: 'confirm',
    name: 'generateUser',
    message: 'Generate User module?',
    default: true,
    skip: (answers) => answers.useDefaults === true,
  },
]

export const promptProvider = {
  async handleMissingOptions(options: ApiLibGeneratorSchema) {
    // If useDefaults is explicitly set to true in options, return immediately with defaults
    if (options.useDefaults === true) {
      return { ...defaultOptions, ...options }
    }

    // Only prompt for useDefaults first
    const useDefaultsPrompt = prompts[0]
    const { useDefaults } = await prompt<{ useDefaults: boolean }>({
      type: useDefaultsPrompt.type,
      name: useDefaultsPrompt.name,
      message: useDefaultsPrompt.message,
      initial: useDefaultsPrompt.default,
    })

    // If user chose defaults, return immediately with default values
    if (useDefaults) {
      return { ...defaultOptions, ...options, useDefaults }
    }

    // Otherwise, prompt for remaining options (skipping the useDefaults prompt)
    const remainingAnswers = await prompt(prompts.slice(1))
    return { ...options, useDefaults, ...remainingAnswers }
  },
}
