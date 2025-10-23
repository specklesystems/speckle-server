/** @type {import('tailwindcss').Config} */
const speckleTheme = require('@speckle/tailwind-theme').plugin
const themeEntries =
  require('@speckle/tailwind-theme/tailwind-configure').tailwindContentEntries
const uiLibEntries =
  require('@speckle/ui-components/tailwind-configure').tailwindContentEntries
const formsPlugin = require('@tailwindcss/forms')
const typographyPlugin = require('@tailwindcss/typography')

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    ...themeEntries(),
    ...uiLibEntries()
  ],
  theme: {
    extend: {}
  },
  plugins: [
    speckleTheme,
    formsPlugin,
    typographyPlugin,
    require('@tailwindcss/container-queries')
  ]
}
