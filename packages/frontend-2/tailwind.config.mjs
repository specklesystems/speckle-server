import speckleTheme from '@speckle/tailwind-theme'
import { tailwindContentEntry as themeEntry } from '@speckle/tailwind-theme/tailwind-configure'
import { tailwindContentEntry as uiLibEntry } from '@speckle/ui-components/tailwind-configure'
import formsPlugin from '@tailwindcss/forms'

import { createRequire } from 'module'
const req = createRequire(import.meta.url)

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
    themeEntry(req),
    uiLibEntry(req)
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  plugins: [speckleTheme, formsPlugin]
}

export default config
