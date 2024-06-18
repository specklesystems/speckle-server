const speckleTheme = require('@speckle/tailwind-theme')
const {
  tailwindContentEntry: themeEntry
} = require('@speckle/tailwind-theme/tailwind-configure')
const {
  tailwindContentEntry: uiLibEntry
} = require('@speckle/ui-components/tailwind-configure')
const formsPlugin = require('@tailwindcss/forms')
const typographyPlugin = require('@tailwindcss/typography')
const { createRequire } = require('module')

// i know, this is bizarre - import.meta.url in a CJS file
// but this happens because apparently this file is transpiled to different formats (ESM/CJS) multiple times
// if this were an mjs file it wouldn't work
const req = createRequire(import.meta.url)

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
    themeEntry(req),
    uiLibEntry(req)
  ],
  plugins: [speckleTheme, formsPlugin, typographyPlugin]
}

module.exports = config
