/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import '~~/src/assets/tailwind.css'
import 'tippy.js/dist/tippy.css'
import type { Parameters, Decorator } from '@storybook/vue3'
import { useArgs, useGlobals } from '@storybook/preview-api'
import SingletonManagers from '../src/stories/components/SingletonManagers.vue'

export const parameters: Parameters = {
  // Main storybook params
  viewport: {
    viewports: {
      mobile1: {
        name: 'Small mobile (320px)',
        styles: { width: '320px', height: '568px' }, // ratio 0.56
        type: 'mobile'
      },
      mobile2: {
        name: 'Large mobile (414px)',
        styles: { width: '414px', height: '896px' }, // ratio 0.46
        type: 'mobile'
      },
      SM: {
        name: 'SM (640px)',
        styles: { width: '640px', height: '1024px' },
        type: 'mobile'
      },
      MD: {
        name: 'MD (768px)',
        styles: { width: '768px', height: '1024px' },
        type: 'tablet'
      },
      LG: {
        name: 'LG (1024px)',
        styles: { width: '1024px', height: '768px' },
        type: 'desktop'
      },
      XL: {
        name: 'XL (1280px)',
        styles: { width: '1280px', height: '768px' },
        type: 'desktop'
      },
      '2XL': {
        name: '2XL (1536px)',
        styles: { width: '1536px', height: '1024px' },
        type: 'desktop'
      }
    }
  },
  backgrounds: {
    // Using tailwind theme bg values
    default: 'foundation-page',
    values: [
      {
        name: 'foundation-page',
        value: 'var(--foundation-page)'
      },
      {
        name: 'foundation',
        value: 'var(--foundation)'
      },
      {
        name: 'foundation-2',
        value: 'var(--foundation-2)'
      },
      {
        name: 'foundation-3',
        value: 'var(--foundation-3)'
      },
      {
        name: 'foundation-4',
        value: 'var(--foundation-4)'
      },
      {
        name: 'foundation-5',
        value: 'var(--foundation-5)'
      },
      {
        name: 'foundation-focus',
        value: 'var(--foundation-focus)'
      },
      {
        name: 'foundation-disabled',
        value: 'var(--foundation-disabled)'
      }
    ]
  }
}

export const decorators: Decorator[] = [
  // Feed in updateArgs() into stories
  (story, ctx) => {
    const [, updateArgs] = useArgs()
    return story({ ...ctx, updateArgs })
  },
  /**
   * - Global CSS class setup
   * - Theme support
   */
  (story) => {
    const [globals] = useGlobals()
    const theme = globals.theme
    const isDarkMode = theme === 'dark'

    if (isDarkMode) {
      document.querySelector('html').classList.add('dark')
    } else {
      document.querySelector('html').classList.remove('dark')
    }

    return {
      components: {
        Story: story(),
        SingletonManagers
      },
      inheritAttrs: false,
      template: `
        <div class="text-foreground">
          <Story v-bind="$attrs" />
          <SingletonManagers />
        </div>
      `
    }
  }
]

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      // Array of plain string values or MenuItem shape (see below)
      items: ['light', 'dark'],
      // Property that specifies if the name of the item will be displayed
      title: 'Theme',
      // Change title based on selected value
      dynamicTitle: true
    }
  }
}

export const tags = ['autodocs']
