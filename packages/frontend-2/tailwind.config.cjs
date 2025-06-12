const speckleTheme = require('@speckle/tailwind-theme').plugin
const themeEntries =
  require('@speckle/tailwind-theme/tailwind-configure').tailwindContentEntries
const uiLibEntries =
  require('@speckle/ui-components/tailwind-configure').tailwindContentEntries
const formsPlugin = require('@tailwindcss/forms')
const typographyPlugin = require('@tailwindcss/typography')

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
    './lib/**/composables/*.{js,ts}',
    ...themeEntries(),
    ...uiLibEntries()
  ],
  plugins: [speckleTheme, formsPlugin, typographyPlugin]
}

module.exports = config
