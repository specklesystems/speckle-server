import speckleTheme from '@speckle/tailwind-theme'

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
    '@speckle/tailwind-theme/**.js'
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  plugins: [speckleTheme]
}

export default config
