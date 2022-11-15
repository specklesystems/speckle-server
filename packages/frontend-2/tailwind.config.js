const colors = require('tailwindcss/colors')

/**
 * This theme is largely based on the one we have for the Speckle website - similar color palette etc.
 *
 * IMPORTANT: Discuss any changes to the theme (extra colors, spacings etc.) with the team, cause we don't want too many options (colors/spacings/etc) to be available as that reduces consistency across the page
 */

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
    './.storybook/**/*.{js,ts,vue}'
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  theme: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
    },
    extend: {
      colors: {
        foundation: {
          DEFAULT: 'var(--foundation)',
          2: 'var(--foundation-2)',
          page: 'var(--foundation-page)'
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          2: 'var(--foreground-2)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          focus: 'var(--primary-focus)',
          muted: 'var(--primary-muted)'
        },
        danger: {
          DEFAULT: colors.red['500'],
          lighter: colors.red['400'],
          darker: colors.red['600']
        },
        warning: {
          DEFAULT: colors.amber['500'],
          lighter: colors.amber['400'],
          darker: colors.amber['600']
        },
        success: {
          DEFAULT: colors.green['500'],
          lighter: colors.green['400'],
          darker: colors.green['600']
        },
        disabled: {
          DEFAULT: 'var(--disabled)',
          muted: 'var(--disabled-muted)'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')]
}

module.exports = config
