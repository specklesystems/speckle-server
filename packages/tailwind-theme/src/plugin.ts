import buildPlugin from 'tailwindcss/plugin.js'
import { config as preset } from './preset.js'
import { primitives } from './primitives.js'

export const lightThemeVariables = {
  /* used only as the page background */
  '--foundation-page': primitives.neutral[99],
  /* used as the background for any elements that sit on the page */
  '--foundation': primitives.white,
  '--foundation-2': primitives.neutral[97],
  '--foundation-3': '#fcfcfc',
  '--foundation-4': '#fcfcfc',
  '--foundation-5': '#fcfcfc',
  /* for hover/focus states */
  '--foundation-focus': '#dbeafe',
  /* for disabled backgrounds */
  '--foundation-disabled': '#e5e5e5',

  /* default foreground color */
  '--foreground': primitives.neutral[10],
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': primitives.neutral[25],
  '--foreground-3': primitives.neutral[40],
  /* foreground color when put on top of a primary colored background */
  '--foreground-on-primary': primitives.white,
  '--foreground-disabled': '#1A1A1A50',

  /* primary color */
  '--primary': primitives.blue[50],
  /* focused primary color */
  '--primary-focus': primitives.blue[40],
  /* muted primary color */
  '--primary-muted': primitives.neutral[92],

  /* outline variations */
  '--outline-1': primitives.blue[55],
  '--outline-2': primitives.neutral[90],
  '--outline-3': primitives.neutral[95],
  '--outline-4': primitives.blue[50],
  '--outline-5': primitives.neutral[85],

  /* highlight variations */
  '--highlight-1': primitives.neutralAlpha[97],
  '--highlight-2': primitives.neutralAlpha[95],
  '--highlight-3': primitives.neutralAlpha[92],

  /* success variations */
  '--success': primitives.green[65],
  '--success-lighter': primitives.green[85],
  '--success-lightest': primitives.green[95],
  '--success-darker': primitives.green[55],

  /* warning variations */
  '--warning': primitives.yellow[65],
  '--warning-lighter': primitives.yellow[85],
  '--warning-lightest': primitives.yellow[97],
  '--warning-darker': primitives.yellow[55],

  /* info variations */
  '--info': primitives.blue[55],
  '--info-lighter': primitives.blue[90],
  '--info-lightest': primitives.blue[95],
  '--info-darker': primitives.blue[30],

  /* danger variations */
  '--danger': primitives.red[50],
  '--danger-lighter': primitives.red[75],
  '--danger-lightest': primitives.red[95],
  '--danger-darker': primitives.red[40]
}

export const darkThemeVariables = {
  /* used only as the page background */
  '--foundation-page': primitives.darkNeutral[5],
  /* used as the background for any elements that sit on the page */
  '--foundation': primitives.darkNeutral[10],
  '--foundation-2': primitives.darkNeutral[15],
  '--foundation-3': '#52525b',
  '--foundation-4': '#71717a',
  '--foundation-5': '#a1a1aa',
  /* for hover/focus states */
  '--foundation-focus': '#52525b',
  /* for disabled backgrounds */
  '--foundation-disabled': '#3c3c3d',

  /* default foreground color */
  '--foreground': primitives.darkNeutral[99],
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': primitives.darkNeutral[75],
  '--foreground-3': primitives.darkNeutral[50],
  '--foreground-on-primary': '#FFFFFF',
  '--foreground-disabled': '#FFFFFF50',

  /* primary color */
  '--primary': primitives.blue[50],
  /* focused primary color */
  '--primary-focus': primitives.blue[55],
  /* muted primary color */
  '--primary-muted': primitives.darkNeutral[20],

  /* outline variations */
  '--outline-1': primitives.blue[40],
  '--outline-2': primitives.darkNeutral[20],
  '--outline-3': primitives.darkNeutral[25],
  '--outline-4': primitives.blue[50],
  '--outline-5': primitives.darkNeutral[30],

  /* highlight variations */
  '--highlight-1': primitives.darkNeutralAlpha[15],
  '--highlight-2': primitives.darkNeutralAlpha[20],
  '--highlight-3': primitives.darkNeutralAlpha[25],

  /* success variations */
  '--success': primitives.green[55],
  '--success-lighter': primitives.green[30],
  '--success-lightest': primitives.green[15],
  '--success-darker': primitives.green[65],

  /* warning variations */
  '--warning': primitives.yellow[75],
  '--warning-lighter': primitives.yellow[30],
  '--warning-lightest': primitives.yellow[15],
  '--warning-darker': primitives.yellow[65],

  /* info variations */
  '--info': primitives.blue[35],
  '--info-lighter': primitives.blue[15],
  '--info-lightest': primitives.blue[10],
  '--info-darker': primitives.blue[55],

  /* danger variations */
  '--danger': primitives.red[50],
  '--danger-lighter': primitives.red[25],
  '--danger-lightest': primitives.red[15],
  '--danger-darker': primitives.red[55]
}

const plugin = buildPlugin(({ addComponents, addBase }) => {
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
      '@apply font-semibold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-transparent bg-clip-text':
        {}
    },
    // Heading styles
    '.text-heading-2xl, .h1': {
      '@apply font-medium text-[2rem] leading-8 tracking-[-0.044rem]': {}
    },
    '.text-heading-xl, .h2': {
      '@apply font-medium text-2xl leading-9 tracking-[-0.0285rem]': {}
    },
    '.text-heading-lg, .h3': {
      '@apply font-medium text-lg leading-7 tracking-[-0.01575rem]': {}
    },
    '.text-heading, .h4': {
      '@apply font-medium text-base leading-6 tracking-[-0.011rem]': {}
    },
    '.text-heading-sm, .h5, .h6': {
      '@apply font-medium text-sm leading-5 tracking-[-0.00244rem]': {}
    },

    // Body styles
    '.text-body': {
      '@apply text-base leading-6 tracking-[-0.011rem]': {}
    },
    '.text-body-sm': {
      '@apply text-sm leading-5 tracking-[-0.00244rem]': {}
    },
    '.text-body-xs': {
      '@apply text-[0.8125rem] leading-5 tracking-[-0.00244rem]': {}
    },
    '.text-body-2xs': {
      '@apply text-xs leading-4': {}
    },
    '.text-body-3xs': {
      '@apply text-[0.6875rem] leading-4 tracking-[0.00344rem]': {}
    },

    '.label': {
      '@apply text-[13px] font-medium leading-5': {}
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
    // Limit reached pattern
    '.diagonal-stripes': {
      backgroundImage:
        'repeating-linear-gradient(-45deg, transparent, transparent 5px, var(--outline-3) 7px)'
    },
    // Simple scrollbar (OSX-like) to use instead of the ugly browser one
    '.simple-scrollbar': {
      'scrollbar-width': 'var(--simple-scrollbar-width)',
      'scrollbar-color': 'var(--outline-5)',
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
        background: 'var(--outline-5)'
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'var(--outline-5)'
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

export { plugin }
