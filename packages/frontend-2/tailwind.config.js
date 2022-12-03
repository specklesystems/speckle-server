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
    './.storybook/**/*.{js,ts,vue}',
    './lib/**/composables/*.{js,ts}'
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  theme: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
    },
    extend: {
      colors: {
        foundation: {
          page: 'var(--foundation-page)',
          DEFAULT: 'var(--foundation)',
          2: 'var(--foundation-2)',
          disabled: 'var(--foundation-disabled)'
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          2: 'var(--foreground-2)',
          disabled: 'var(--foreground-disabled)',
          'on-primary': 'var(--foreground-on-primary)',
          primary: 'var(--foreground-primary)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          focus: 'var(--primary-focus)',
          muted: 'var(--primary-muted)',
          outline: 'var(--primary-outline)',
          'outline-2': 'var(--primary-outline-2)'
        },
        success: {
          DEFAULT: 'var(--success)',
          lighter: 'var(--success-lighter)',
          darker: 'var(--success-darker)'
        },
        warning: {
          DEFAULT: 'var(--warning)',
          lighter: 'var(--warning-lighter)',
          darker: 'var(--warning-darker)'
        },
        info: {
          DEFAULT: 'var(--info)',
          lighter: 'var(--info-lighter)',
          darker: 'var(--info-darker)'
        },
        danger: {
          DEFAULT: 'var(--danger)',
          lighter: 'var(--danger-lighter)',
          darker: 'var(--danger-darker)'
        }
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')]
}

module.exports = config
