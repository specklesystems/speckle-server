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
          page: 'var(--foundation-page)',
          DEFAULT: 'var(--foundation)',
          2: 'var(--foundation-2)',
          3: 'var(--foundation-3)',
          4: 'var(--foundation-4)',
          5: 'var(--foundation-5)',
          focus: 'var(--foundation-focus)',
          disabled: 'var(--foundation-disabled)'
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          2: 'var(--foreground-2)',
          3: 'var(--foreground-3)',
          disabled: 'var(--foreground-disabled)',
          'on-primary': 'var(--foreground-on-primary)',
          primary: 'var(--foreground-primary)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          focus: 'var(--primary-focus)',
          muted: 'var(--primary-muted)'
        },
        outline: {
          1: 'var(--outline-1)',
          2: 'var(--outline-2)',
          3: 'var(--outline-3)',
          4: 'var(--outline-4)',
          5: 'var(--outline-5)'
        },
        highlight: {
          1: 'var(--highlight-1)',
          2: 'var(--highlight-2)',
          3: 'var(--highlight-3)'
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
  plugins: [FormsPlugin]
}

export default config
