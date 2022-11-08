const colors = require('tailwindcss/colors')
const _ = require('lodash')

/**
 * This theme is largely based on the one we have for the Speckle website - similar color palette etc.
 *
 * IMPORTANT: Discuss any changes to the theme (extra colors, spacings etc.) with the team, cause we don't want too many options (colors/spacings/etc) to be available as that reduces consistency across the page
 */

// Generating typography plugin colors. Three themes are available: default, prose-secondary, prose-ternary
// and they rely on the main semantic color system
const typographyBase = (theme, type) => {
  // increase/decrease modifier value (DEFAULT(1),2,3) by amount
  const change = (val, amount = 1, increase = true) => {
    if (val === 'DEFAULT') val = 1
    const newVal = _.clamp(increase ? val + amount : val - amount, 1, 3)
    return newVal === 1 ? 'DEFAULT' : newVal
  }

  // resolve modifier value according to theme type
  const modifier = (val) => {
    if (type === 'secondary') return change(val, 1, true)
    if (type === 'ternary') return change(val, 2, true)
    return val
  }

  return {
    '--tw-prose-body': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-headings': theme(`colors.foreground[${modifier('DEFAULT')}]`),
    '--tw-prose-lead': theme(`colors.foreground[${modifier('DEFAULT')}]`),
    '--tw-prose-links': theme('colors.link[DEFAULT]'),
    '--tw-prose-bold': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-counters': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-bullets': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-hr': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-quotes': theme(`colors.foreground[${modifier(3)}]`),
    '--tw-prose-quote-borders': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-captions': theme(`colors.foreground[${modifier(3)}]`),
    '--tw-prose-code': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-pre-code': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-pre-bg': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-th-borders': theme(`colors.foreground[${modifier(2)}]`),
    '--tw-prose-td-borders': theme(`colors.foreground[${modifier(2)}]`)
  }
}

const typographyDark = (theme, type) => {
  const base = typographyBase(theme, type)
  return _.mapKeys(base, (_, key) => {
    const [, suffix] = key.match(/^--tw-prose-(.+)$/) || []
    return `--tw-prose-invert-${suffix}`
  })
}

const typographyTheme = (theme, type) => ({
  ...typographyBase(theme, type),
  ...typographyDark(theme, type)
})

/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
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
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--bg-default)',
          base: 'var(--bg-base)',
          accent: 'var(--bg-accent)'
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          dim: 'var(--foreground-dim)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          focus: 'var(--primary-focus)'
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
        }
      },
      typography: ({ theme }) => ({
        // Default typography theme
        gray: {
          css: {
            ...typographyTheme(theme)
          }
        },
        secondary: {
          css: {
            ...typographyTheme(theme, 'secondary')
          }
        },
        ternary: {
          css: {
            ...typographyTheme(theme, 'ternary')
          }
        },
        // Final CSS adjustments
        // TODO: Override margins to be in our scale & set up prose-xs
        DEFAULT: {
          css: {
            a: {
              textDecoration: 'inherit',
              fontWeight: 'inherit'
            }
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp')
  ]
}

module.exports = config
