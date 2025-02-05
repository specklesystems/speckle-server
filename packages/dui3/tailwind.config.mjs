import speckleTheme from '@speckle/tailwind-theme'
import { tailwindContentEntries as themeEntries } from '@speckle/tailwind-theme/tailwind-configure'
import { tailwindContentEntries as uiLibEntries } from '@speckle/ui-components/tailwind-configure'
import formsPlugin from '@tailwindcss/forms'

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
  plugins: [speckleTheme, formsPlugin]
}

export default config
