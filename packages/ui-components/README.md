# ui-components

Speckle UI component library built with Vue 3 and relying on the Speckle Tailwind theme.

## Setup

1. Make sure you have `@speckle/tailwind-theme` installed and set up with Tailwind
1. Install `@speckle/ui-components`
1. In your tailwind config import `tailwindContentEntry` from `@speckle/ui-components/tailwind-configure` and invoke it in the `contents` field to ensure PurgeCSS is configured correctly. It requires the CJS `require` object as its only parameter. If it isn't available (in an ESM environment), you can use node's `createRequire()`.
1. Import `@speckle/ui-components/style.css` in your app. If `exports` map isn't supported you can also import from `@speckle/ui-components/dist/style.css`

### Usage in Nuxt v3

It's suggested that you also install the `@speckle/ui-components-nuxt` Nuxt module. It will ensure that all of the Vue components can be auto-imported like components in nuxt's `./components` directory. No need to import them manually anymore and you'll also get proper TS typing in your Vue templates out of the box!

### Troubleshooting

#### Form validation doesn't work

It appears that in some scenarios Nuxt/Vite gets confused and bundles 'vee-validate' twice. To fix this add 'vee-validate' to `vite.resolve.dedupe` in your nuxt/vite config.

## Build

Run `yarn build`

## Development

Develop & test your components in Storybook - `yarn storybook`

Optionally you can also run `yarn dev` to run the Vite dev server which runs `App.vue` and in some special scenarios you might want to debug components there.

### Troubleshooting

#### Styles don't work

Re-start storybook, it could be that you introduced a new tailwind class that was previously purged out
