import '~~/assets/css/tailwind.css'

import { buildVueAppSetup } from '~~/lib/fake-nuxt-env/utils/nuxtAppBootstrapper'
import { setup } from '@storybook/vue3'

const setupVueApp = await buildVueAppSetup()

setup((app) => {
  setupVueApp(app)
})

export const parameters = {
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
    // Using tailwind theme bg-background values
    default: 'background',
    values: [
      {
        name: 'background',
        value: 'var(--theme-color-background)'
      },
      {
        name: 'background-2',
        value: 'var(--theme-color-background-2)'
      },
      {
        name: 'background-3',
        value: 'var(--theme-color-background-3)'
      }
    ]
  }
}

export const decorators = [
  (story) => ({
    components: {
      Story: story()
    },
    inheritAttrs: false,
    template: `
      <div class="text-foreground">
        <Story v-bind="$attrs" />
      </div>
    `
  })
]
