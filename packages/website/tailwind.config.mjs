import speckleTheme from '@speckle/tailwind-theme'
import { tailwindContentEntries as themeEntries } from '@speckle/tailwind-theme/tailwind-configure'
import { tailwindContentEntries as uiLibEntries } from '@speckle/ui-components/tailwind-configure'
import formsPlugin from '@tailwindcss/forms'
import tailwindTypography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    `./components/**/*.{vue,js,ts}`,
    `./layouts/**/*.vue`,
    `./pages/**/*.vue`,
    `./composables/**/*.{js,ts}`,
    `./plugins/**/*.{js,ts}`,
    './stories/**/*.{js,ts,vue,mdx}',
    './app.vue',
    './.storybook/**/*.{js,ts,vue}',
    './lib/**/composables/*.{js,ts}',
    ...themeEntries(),
    ...uiLibEntries()
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  plugins: [
    speckleTheme,
    formsPlugin,
    tailwindTypography,
    require('@xpd/tailwind-3dtransforms')
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' }
        },
        'slide-right': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' }
        }
      },
      animation: {
        'slide-left-infinite': 'slide-left 20s linear infinite',
        'slide-left-infinite-slower': 'slide-left 60s linear infinite',
        'slide-right-infinite': 'slide-right 20s linear infinite',
        'slide-right-infinite-slower': 'slide-right 60s linear infinite'
      }
    }
  }
}

export default config
