import plugin from 'tailwindcss/plugin.js'
import preset from './preset.js'

export const lightThemeVariables = {
  /* used only as the page background */
  '--foundation-page': '#f1f5f9',
  /* used as the background for any elements that sit on the page */
  '--foundation': '#fcfcfc',
  '--foundation-2': '#fcfcfc',
  '--foundation-3': '#fcfcfc',
  '--foundation-4': '#fcfcfc',
  '--foundation-5': '#fcfcfc',
  /* for hover/focus states */
  '--foundation-focus': '#dbeafe',
  /* for disabled backgrounds */
  '--foundation-disabled': '#e5e5e5',

  /* default foreground color */
  '--foreground': '#334155',
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': '#94a3b8',
  /* disabled foreground color */
  '--foreground-disabled': '#a3a3a3',
  /* primary color when used for text directly on top of foundation-page */
  '--foreground-primary': '#3b82f6',
  /* foreground color when put on top of a primary colored background */
  '--foreground-on-primary': '#fff',

  /* primary color */
  '--primary': '#3b82f6',
  /* focused primary color */
  '--primary-focus': '#2563eb',
  /* muted primary color */
  '--primary-muted': '#e8eff8',

  /* outline variations */
  '--outline-1': '#3b82f6',
  '--outline-2': '#93c5fd',
  '--outline-3': '#cbd5e1',

  /* success variations */
  '--success': '#34d399',
  '--success-lighter': '#d1fae5',
  '--success-darker': '#064e3b',

  /* warning variations */
  '--warning': '#fbbf24',
  '--warning-lighter': '#fef3c7',
  '--warning-darker': '#78350f',

  /* info variations */
  '--info': '#38bdf8',
  '--info-lighter': '#e0f2fe',
  '--info-darker': '#0c4a6e',

  /* danger variations */
  '--danger': '#f87171',
  '--danger-lighter': '#fee2e2',
  '--danger-darker': '#7f1d1d'
}

export const darkThemeVariables = {
  /* used only as the page background */
  '--foundation-page': '#18181b',
  /* used as the background for any elements that sit on the page */
  '--foundation': '#27272a',
  '--foundation-2': '#303034',
  '--foundation-3': '#52525b',
  '--foundation-4': '#71717a',
  '--foundation-5': '#a1a1aa',
  /* for hover/focus states */
  '--foundation-focus': '#52525b',
  /* for disabled backgrounds */
  '--foundation-disabled': '#3c3c3d',

  /* default foreground color */
  '--foreground': '#f4f4f5',
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': '#71717a',
  /* disabled foreground color */
  '--foreground-disabled': '#5a5a5f',
  /* primary color when used for text directly on top of foundation-page */
  '--foreground-primary': '#bfdbfe',
  /* foreground color when put on top of a primary colored background */
  '--foreground-on-primary': '#fafafa',

  /* primary color */
  '--primary': '#3b82f6',
  /* focused primary color */
  '--primary-focus': '#60a5fa',
  /* muted primary color */
  '--primary-muted': '#1d1d20',

  /* outline variations */
  '--outline-1': '#a1a1aa',
  '--outline-2': '#52525b',
  '--outline-3': '#3f3f46',

  /* success variations */
  '--success': '#34d399',
  '--success-lighter': '#a7f3d0',
  '--success-darker': '#064e3b',

  /* warning variations */
  '--warning': '#facc15',
  '--warning-lighter': '#fef08a',
  '--warning-darker': '#78350f',

  /* info variations */
  '--info': '#38bdf8',
  '--info-lighter': '#bae6fd',
  '--info-darker': '#0c4a6e',

  /* danger variations */
  '--danger': '#f87171',
  '--danger-lighter': '#fecaca',
  '--danger-darker': '#7f1d1d'
}

export default plugin(function ({ addComponents, addBase }) {
  addBase({
    "[type='checkbox']:focus, [type='radio']:focus": {
      '@apply ring-offset-foundation': {}
    },
    "input[type='range']": {
      '@apply appearance-none bg-transparent': {}
    },
    "input[type='range']::-webkit-slider-runnable-track": {
      '@apply bg-black/25 rounded-full': {}
    },
    "input[type='range']::-moz-range-track": {
      '@apply bg-black/25 rounded-full': {}
    },
    "input[type='range']::-ms-track": {
      '@apply bg-black/25 rounded-full': {}
    },
    body: {
      '@apply font-sans': {}
    },
    html: {
      '--simple-scrollbar-width': '4px',
      ...lightThemeVariables,
      '&.dark': {
        ...darkThemeVariables
      }
    },
    // weird hack cause for some reason tailwind sometimes omits this if I use `.dark` selector instead (tailwind bug?)
    [`html[class*="dark"]`]: {
      ...darkThemeVariables
    }
  })

  addComponents({
    // Font sizes
    '.h1': {
      '@apply text-5xl leading-10': {}
    },
    '.h2': {
      '@apply text-4xl leading-10': {}
    },
    '.h3': {
      '@apply text-3xl leading-9': {}
    },
    '.h4': {
      '@apply text-2xl leading-8': {}
    },
    '.h5': {
      '@apply text-xl leading-7': {}
    },
    '.h6': {
      '@apply text-lg leading-6': {}
    },
    '.label': {
      '@apply text-sm font-medium leading-5': {}
    },
    '.label--light': {
      '@apply font-normal': {}
    },
    '.label-light': {
      '@apply label label--light': {}
    },
    '.normal': {
      '@apply text-base font-normal': {}
    },
    '.caption': {
      '@apply text-xs': {}
    },
    '.text-tiny': {
      'font-size': '0.6rem',
      'line-height': '1rem'
    },
    // Grid/layout container that limits max width to expected sizes that we use in our designs
    '.layout-container': {
      '@apply mx-auto': {},
      /* base/mobile - fluid, no max width, just padding */
      '@apply px-4': {},
      /* sm+ - also fluid, increased padding */
      "@media (min-width: theme('screens.sm'))": {
        '@apply px-8': {}
      },
      /* lg+ (from this point on, no padding just limited max width) */
      "@media (min-width: theme('screens.lg'))": {
        '@apply px-6 max-w-full': {}
      },
      /* xl+ */
      "@media (min-width: theme('screens.xl'))": {
        '@apply max-w-[1216px]': {}
      },
      /* 2xl+ */
      "@media (min-width: theme('screens.2xl'))": {
        '@apply max-w-[1312px]': {}
      }
    },
    // Simple scrollbar (OSX-like) to use instead of the ugly browser one
    '.simple-scrollbar': {
      'scrollbar-width': 'var(--simple-scrollbar-width)',
      'scrollbar-color': 'var(--foreground-2)',
      '&::-webkit-scrollbar': {
        width: 'var(--simple-scrollbar-width)',
        height: '6px'
      },
      '&::-webkit-scrollbar-track': {
        'border-radius': '15px',
        background: 'var(--foundation-disabled)'
      },
      '&::-webkit-scrollbar-thumb': {
        'border-radius': '15px',
        background: 'var(--foreground-2)'
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'var(--foreground-2)'
      },
      '&::-webkit-scrollbar-thumb:active': {
        background: 'rgba(90 90 90 10100%)'
      }
    }
  })
}, preset)
