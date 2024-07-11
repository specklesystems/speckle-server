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
    /* cyrillic-ext */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-cyrillic-ext.woff2') format('woff2')",
      unicodeRange:
        'U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F'
    }
  })

  addBase({
    /* cyrillic */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-cyrillic.woff2') format('woff2')",
      unicodeRange: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'
    }
  })

  addBase({
    /* greek-ext */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-greek-ext.woff2') format('woff2')",
      unicodeRange: 'U+1F00-1FFF'
    }
  })

  addBase({
    /* greek */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-greek.woff2') format('woff2')",
      unicodeRange:
        'U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF'
    }
  })

  addBase({
    /* vietnamese */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-vietnamese.woff2') format('woff2')",
      unicodeRange:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB'
    }
  })

  addBase({
    /* latin-ext */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-latin-ext.woff2') format('woff2')",
      unicodeRange:
        'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
    }
  })

  addBase({
    /* latin */
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'swap',
      src: "url('@speckle/tailwind-theme/fonts/inter-latin.woff2') format('woff2')",
      unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
    }
  })

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
    // Fancy gradient text
    '.text-fancy-gradient': {
      '@apply font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-transparent bg-clip-text':
        {}
    },
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
    },
    // Auto-growing textarea for editable fields
    // more info: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
    '.grow-textarea': {
      display: 'grid',
      '&::after': {
        content: "attr(data-replicated-value) ' '",
        visibility: 'hidden',
        'white-space': 'pre-wrap'
      },
      '& > textarea': {
        resize: 'none',
        overflow: 'hidden'
      },
      '& > textarea, &::after': {
        'grid-area': '1 / 1 / 2 / 2'
      }
    }
  })
}, preset)
