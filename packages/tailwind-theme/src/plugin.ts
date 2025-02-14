import buildPlugin from 'tailwindcss/plugin.js'
import preset from './preset.js'

export const lightThemeVariables = {
  /* used only as the page background */
  '--foundation-page': '250, 250, 250',
  /* used as the background for any elements that sit on the page */
  '--foundation': '255, 255, 255',
  '--foundation-2': '245, 245, 245',
  '--foundation-3': '252, 252, 252',
  '--foundation-4': '252, 252, 252',
  '--foundation-5': '252, 252, 252',
  /* for hover/focus states */
  '--foundation-focus': '219, 234, 254',
  /* for disabled backgrounds */
  '--foundation-disabled': '229, 229, 229',

  /* default foreground color */
  '--foreground': '26, 26, 26',
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': '98, 98, 99',
  '--foreground-3': '124, 124, 125',
  /* foreground color when put on top of a primary colored background */
  '--foreground-on-primary': '255, 255, 255',
  '--foreground-disabled': '26, 26, 26',

  /* primary color */
  '--primary': '19, 108, 255',
  /* focused primary color */
  '--primary-focus': '0, 87, 229',
  /* muted primary color */
  '--primary-muted': '237, 237, 237',

  /* outline variations */
  '--outline-1': '39, 111, 229',
  '--outline-2': '223, 223, 223',
  '--outline-3': '226, 232, 240',
  '--outline-4': '75, 64, 201',
  '--outline-5': '196, 196, 196',

  /* highlight variations */
  '--highlight-1': '244, 244, 244',
  '--highlight-2': '242, 242, 242',
  '--highlight-3': '237, 237, 237',

  /* success variations */
  '--success': '52, 211, 153',
  '--success-lighter': '83, 237, 181',
  '--success-lightest': '238, 254, 248',
  '--success-darker': '28, 186, 128',

  /* warning variations */
  '--warning': '251, 191, 36',
  '--warning-lighter': '255, 215, 112',
  '--warning-lightest': '254, 249, 238',
  '--warning-darker': '224, 171, 32',

  /* info variations */
  '--info': '184, 192, 204',
  '--info-lighter': '224, 236, 255',
  '--info-lightest': '238, 238, 254',
  '--info-darker': '107, 125, 153',

  /* danger variations */
  '--danger': '196, 89, 89',
  '--danger-lighter': '247, 136, 136',
  '--danger-lightest': '254, 238, 238',
  '--danger-darker': '145, 51, 51'
}

export const darkThemeVariables = {
  /* used only as the page background */
  '--foundation-page': '16, 16, 18',
  /* used as the background for any elements that sit on the page */
  '--foundation': '21, 22, 28',
  '--foundation-2': '25, 26, 34',
  '--foundation-3': '82, 82, 91',
  '--foundation-4': '113, 113, 122',
  '--foundation-5': '161, 161, 170',
  /* for hover/focus states */
  '--foundation-focus': '82, 82, 91',
  /* for disabled backgrounds */
  '--foundation-disabled': '60, 60, 61',

  /* default foreground color */
  '--foreground': '255, 255, 255',
  /* dimmer foreground color, e.g. caption text */
  '--foreground-2': '176, 177, 181',
  '--foreground-3': '126, 127, 130',
  '--foreground-on-primary': '255, 255, 255',
  '--foreground-disabled': '255, 255, 255',

  /* primary color */
  '--primary': '19, 108, 255',
  /* focused primary color */
  '--primary-focus': '0, 87, 229',
  /* muted primary color */
  '--primary-muted': '41, 43, 57',

  /* outline variations */
  '--outline-1': '39, 111, 229',
  '--outline-2': '46, 49, 63',
  '--outline-3': '40, 40, 51',
  '--outline-4': '75, 64, 201',
  '--outline-5': '67, 69, 89',

  /* highlight variations */
  '--highlight-1': '34, 36, 46',
  '--highlight-2': '41, 43, 57',
  '--highlight-3': '50, 52, 69',

  /* success variations */
  '--success': '52, 211, 153',
  '--success-lighter': '83, 237, 181',
  '--success-lightest': '7, 44, 31',
  '--success-darker': '28, 186, 128',

  /* warning variations */
  '--warning': '251, 191, 36',
  '--warning-lighter': '255, 215, 112',
  '--warning-lightest': '48, 35, 3',
  '--warning-darker': '224, 171, 32',

  /* info variations */
  '--info': '184, 192, 204',
  '--info-lighter': '224, 236, 255',
  '--info-lightest': '3, 3, 48',
  '--info-darker': '107, 125, 153',

  /* danger variations */
  '--danger': '248, 113, 113',
  '--danger-lighter': '255, 143, 143',
  '--danger-lightest': '48, 3, 3',
  '--danger-darker': '171, 62, 62'
}

const plugin = buildPlugin(function ({ addComponents, addBase }) {
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
    // New heading styles
    '.text-heading-2xl, .h1': {
      '@apply font-medium text-3xl leading-10 tracking-[-0.63px]': {}
    },
    '.text-heading-xl, .h2': {
      '@apply font-medium text-2xl leading-8 tracking-[-0.456px]': {}
    },
    '.text-heading-lg, .h3': {
      '@apply font-medium text-lg leading-6 tracking-[-0.252px]': {}
    },
    '.text-heading, .h4': {
      '@apply font-medium text-base leading-6 tracking-[-0.176px]': {}
    },
    '.text-heading-sm, .h5, .h6': {
      '@apply font-medium text-sm leading-6 tracking-[-0.084px]': {}
    },

    // New body styles
    '.text-body': {
      '@apply text-base leading-6 tracking-[-0.176px]': {}
    },
    '.text-body-sm': {
      '@apply text-sm leading-6 tracking-[-0.084px]': {}
    },
    '.text-body-xs': {
      '@apply text-[13px] leading-6 tracking-[-0.032px]': {}
    },
    '.text-body-2xs': {
      '@apply text-xs leading-4': {}
    },
    '.text-body-3xs': {
      '@apply text-[11px] leading-4 tracking-[0.055px]': {}
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

export default plugin
export { plugin }
