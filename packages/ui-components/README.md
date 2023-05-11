# ui-components

Speckle UI component library built with Vue 3 and relying on the Speckle Tailwind theme.

## Setup

1. Make sure you have `@speckle/tailwind-theme` installed
1. Install `@speckle/ui-components`
1. Add `@speckle/ui-components/**/*.js` to the `contents` field in your Tailwind config
1. Import `@speckle/ui-components/style.css` in your app. If `exports` map isn't supported you can also import from `@speckle/ui-components/dist/style.css`

## Build

Run `yarn build`

## Development

Develop & test your components in Storybook - `yarn storybook`

Optionally you can also run `yarn dev` to run the Vite dev server which runs `App.vue` and in some special scenarios you might
want to debug components there.

### Troubleshooting

#### Styles don't work

Re-start storybook, it could be that you introduced a new tailwind class that was previously purged out

## TODO

- Add export to Chromatic
- Add test-storybook
