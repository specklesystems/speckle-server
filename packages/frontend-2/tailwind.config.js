const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    `./components/**/*.{vue,js,ts}`,
    `./layouts/**/*.vue`,
    `./pages/**/*.vue`,
    `./composables/**/*.{js,ts}`,
    `./plugins/**/*.{js,ts}`,
    './app.vue'
    // `./lib/**/*.{js,ts,vue}`, // TODO: Wait for fix https://github.com/nuxt/framework/issues/2886#issuecomment-1108312903
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Main color palette - try to only use these so that we can add multiple theme (dark mode)
         * support in the future without difficulty
         */
        background: {
          DEFAULT: colors.white,
          2: colors.gray['100'],
          3: colors.gray['200']
        },
        foreground: {
          DEFAULT: colors.gray['900'],
          2: colors.gray['700'],
          3: colors.gray['500'],
          4: colors.gray['300']
        },
        primary: {
          DEFAULT: colors.sky['600'],
          lighter: colors.sky['400'],
          darker: colors.sky['700']
        },
        secondary: {
          DEFAULT: colors.slate['600'],
          lighter: colors.slate['400'],
          darker: colors.slate['700']
        },
        danger: {
          DEFAULT: colors.red['600'],
          lighter: colors.red['400'],
          darker: colors.red['700']
        },
        link: {
          DEFAULT: colors.blue['600'],
          lighter: colors.blue['400'],
          darker: colors.blue['700']
        }
      }
    },
    spacing: {
      0: '0px',
      1: '0.25rem',
      2: '0.5rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      32: '8rem',
      40: '10rem',
      48: '12rem',
      56: '14rem',
      64: '16rem',
      96: '24rem',
      128: '32rem'
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')]
}
