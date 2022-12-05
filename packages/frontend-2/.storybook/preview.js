import '~~/assets/css/tailwind.css'
import { setupVueApp } from '~~/lib/fake-nuxt-env/utils/nuxtAppBootstrapper'
import { MockedProvider } from '~~/lib/fake-nuxt-env/components/MockedProvider'
import { setup } from '@storybook/vue3'
import SingletonManagers from '~~/components/singleton/Managers.vue'
import { useArgs } from '@storybook/client-api'

setup((app) => {
  setupVueApp(app)
})

export const parameters = {
  // Main storybook params
  controls: {
    matchers: {
      color: /^(background|color)$/i,
      date: /Date$/
    }
  },
  viewport: {
    viewports: {
      mobile1: {
        name: 'Small mobile',
        styles: { width: '320px', height: '568px' }, // ratio 0.56
        type: 'mobile'
      },
      mobile2: {
        name: 'Large mobile',
        styles: { width: '414px', height: '896px' }, // ratio 0.46
        type: 'mobile'
      },
      SM: {
        name: 'SM',
        styles: { width: '640px', height: '1024px' },
        type: 'mobile'
      },
      MD: {
        name: 'MD',
        styles: { width: '768px', height: '1024px' },
        type: 'tablet'
      },
      LG: {
        name: 'LG',
        styles: { width: '1024px', height: '768px' },
        type: 'desktop'
      },
      XL: {
        name: 'XL',
        styles: { width: '1280px', height: '768px' },
        type: 'desktop'
      },
      '2XL': {
        name: '2XL',
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
  },
  // Custom params
  apolloClient: {
    MockedProvider
  }
}

/** @type {import('@storybook/csf').DecoratorFunction[]} */
export const decorators = [
  // Feed in updateArgs() into stories
  (story, ctx) => {
    const [, updateArgs] = useArgs()
    return story({ ...ctx, updateArgs })
  },

  /**
   * - Global CSS class setup
   * - Theme support
   * - Global singletons
   */
  (story, ctx) => {
    const theme = ctx.globals.theme
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
  },
  // Apollo Mocked Provider decorator
  (story, ctx) => {
    const {
      parameters: {
        apolloClient: { MockedProvider, ...providerProps }
      }
    } = ctx

    if (!MockedProvider) {
      console.error('Apollo MockedProvider missing from parameters in preview.js!')
      return { template: `<Story/>`, components: { Story: story() } }
    }

    return {
      data: () => ({ providerProps }),
      components: { MockedProvider, Story: story() },
      template: `
        <MockedProvider :options="providerProps || {}"><Story/></MockedProvider>
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
