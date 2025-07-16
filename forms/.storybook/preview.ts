import React, { useEffect } from 'react'
import type { Decorator, Preview } from '@storybook/react'

// --- Theme Injection Setup (Your existing code) ---
import { tailwindTheme } from '@nestledjs/forms'

// Import as string rather than URL to avoid dependency scanning issues
import '@mdxeditor/editor/style.css'
import './styles.css'
// Using a fixed path since we know where it will be in runtime
const TAILWIND_CSS_PATH = '/forms/.storybook/styles.css'

const themeMap = {
  tailwind: tailwindTheme,
}

// --- Global Toggles Definition (Combined) ---
export const globalTypes = {
  // 1. Your existing theme switcher
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'tailwind',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'tailwind', title: 'Tailwind' },
        { value: 'unstyled', title: 'Unstyled' },
      ],
      showName: true,
    },
  },
  // 2. The new Tailwind CSS toggle
  cssEnvironment: {
    name: 'CSS Environment',
    description: 'Toggle Tailwind CSS (and Preflight reset)',
    defaultValue: 'tailwind',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: 'tailwind', title: 'With Tailwind CSS' },
        { value: 'none', title: 'Without Tailwind CSS' },
      ],
      showName: true,
    },
  },
}

// --- Decorator Definitions (We'll combine them) ---

// Decorator #1: Toggles the global CSS file
const withCssToggle: Decorator = (StoryFn, context) => {
  // Define a proper React component inside the decorator.
  // It has access to StoryFn and context from its closure.
  const WrapperComponent = () => {
    const { cssEnvironment } = context.globals
    const isTailwindEnabled = cssEnvironment === 'tailwind'

    useEffect(() => {
      const doc = context.canvasElement.ownerDocument
      const linkId = 'tailwind-css-link'
      let link = doc.getElementById(linkId) as HTMLLinkElement | null

      if (isTailwindEnabled) {
        if (!link) {
          link = doc.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          link.href = TAILWIND_CSS_PATH
          doc.head.appendChild(link)
        }
      } else {
        if (link) {
          link?.parentNode?.removeChild(link)
        }
      }
    }, [isTailwindEnabled])

    // The component's render output is the original story.
    return StoryFn()
  }

  // The decorator returns an element created from our new component.
  return React.createElement(WrapperComponent)
}

// Decorator #2: Injects the theme object into story args
const withTheme: Decorator = (StoryFn, context) => {
  // 1. Get the correct theme from your global toggle.
  // 2. Add or overwrite the 'theme' property on the story's args.
  //    This is the key change. We directly modify the args that the story will receive.
  context.args.theme = themeMap[context.globals.theme as keyof typeof themeMap] || tailwindTheme

  // 3. Now, render the story. Storybook will handle passing the modified context.
  return StoryFn()
}

// --- Final Preview Object ---
const preview: Preview = {
  parameters: {
    tags: ['autodocs'],
  },
  // The order matters: the CSS toggle should run first to set up the environment,
  // then the theme injector runs. Decorators are applied from last to first.
  decorators: [withCssToggle, withTheme],
}

export default preview
