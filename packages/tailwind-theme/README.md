# tailwind-theme

Tailwind theme used in frontend 2 and other apps.

## Setup

1. Install the package
1. Import the plugin from `@speckle/tailwind-theme` and use it in your tailwind config
1. Add `@speckle/tailwind-theme/**.js` to the `content` field to configure PurgeCSS properly

## Development

1. Link this repo to wherever you're using this package. Unnecessary if you're using this package somewhere inside this monorepo.
1. Run `yarn build` to re-build

## Viewer

Run `yarn viewer` to open the Tailwind Config Viewer in the browser.

**Note 1:** The project must be built first for this to work!
**Note 2:** All of the custom colors that rely on CSS variables will only show the light mode version irregardless of the "Dark Mode" toggle. This is because of a limitation of Tailwind Config Viewer.
