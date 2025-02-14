import type { Config } from 'tailwindcss'
import FormsPlugin from '@tailwindcss/forms'

const config: Config = {
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
      sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    },
    extend: {
      // Standard Tailwind Shadows add shadows below the element, 'shadow-t" variant adds shadow to the top of the element.
      boxShadow: {
        t: '0 -10px 8px 0 rgb(0 0 0 / 8%), 0 -4px 3px -6px rgb(0 0 0 / 10%)'
      },
      backdropBlur: {
        xs: '2px'
      },
      colors: {
        foundation: {
          page: 'rgba(var(--foundation-page), <alpha-value>)',
          DEFAULT: 'rgba(var(--foundation), <alpha-value>)',
          2: 'rgba(var(--foundation-2), <alpha-value>)',
          3: 'rgba(var(--foundation-3), <alpha-value>)',
          4: 'rgba(var(--foundation-4), <alpha-value>)',
          5: 'rgba(var(--foundation-5), <alpha-value>)',
          focus: 'rgba(var(--foundation-focus), <alpha-value>)',
          disabled: 'rgba(var(--foundation-disabled), <alpha-value>)'
        },
        foreground: {
          DEFAULT: 'rgba(var(--foreground), <alpha-value>)',
          2: 'rgba(var(--foreground-2), <alpha-value>)',
          3: 'rgba(var(--foreground-3), <alpha-value>)',
          disabled: 'rgba(var(--foreground-disabled), <alpha-value>)',
          'on-primary': 'rgba(var(--foreground-on-primary), <alpha-value>)',
          primary: 'rgba(var(--foreground-primary), <alpha-value>)'
        },
        primary: {
          DEFAULT: 'rgba(var(--primary), <alpha-value>)',
          focus: 'rgba(var(--primary-focus), <alpha-value>)',
          muted: 'rgba(var(--primary-muted), <alpha-value>)'
        },
        outline: {
          1: 'rgba(var(--outline-1), <alpha-value>)',
          2: 'rgba(var(--outline-2), <alpha-value>)',
          3: 'rgba(var(--outline-3), <alpha-value>)',
          4: 'rgba(var(--outline-4), <alpha-value>)',
          5: 'rgba(var(--outline-5), <alpha-value>)'
        },
        highlight: {
          1: 'rgba(var(--highlight-1), <alpha-value>)',
          2: 'rgba(var(--highlight-2), <alpha-value>)',
          3: 'rgba(var(--highlight-3), <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgba(var(--success), <alpha-value>)',
          lighter: 'rgba(var(--success-lighter), <alpha-value>)',
          lightest: 'rgba(var(--success-lightest), <alpha-value>)',
          darker: 'rgba(var(--success-darker), <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgba(var(--warning), <alpha-value>)',
          lighter: 'rgba(var(--warning-lighter), <alpha-value>)',
          lightest: 'rgba(var(--warning-lightest), <alpha-value>)',
          darker: 'rgba(var(--warning-darker), <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgba(var(--info), <alpha-value>)',
          lighter: 'rgba(var(--info-lighter), <alpha-value>)',
          lightest: 'rgba(var(--info-lightest), <alpha-value>)',
          darker: 'rgba(var(--info-darker), <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgba(var(--danger), <alpha-value>)',
          lighter: 'rgba(var(--danger-lighter), <alpha-value>)',
          lightest: 'rgba(var(--danger-lightest), <alpha-value>)',
          darker: 'rgba(var(--danger-darker), <alpha-value>)'
        }
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: [FormsPlugin]
}

export default config
