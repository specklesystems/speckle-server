# tailwind-theme

Tailwind theme used in frontend 2 and other apps.

## Setup

1. Install the package
1. In your tailwind config import `@speckle/tailwind-theme` and `@tailwindcss/forms` and add them to your `plugins` array
1. Import `tailwindContentEntry` from `@speckle/tailwind-theme/tailwind-configure` and invoke it in the `contents` field in your Tailwind config to ensure PurgeCSS is configured correctly. It requires the CJS `require` object as its only parameter. If it isn't available (in an ESM environment), you can use node's `createRequire()`.

## Development

1. Link this repo to wherever you're using this package. Unnecessary if you're using this package somewhere inside this monorepo.
1. Run `yarn build` to re-build

## Viewer

Run `yarn viewer` to open the Tailwind Config Viewer in the browser.

**Note 1:** The project must be built first for this to work!
**Note 2:** All of the custom colors that rely on CSS variables will only show the light mode version irregardless of the "Dark Mode" toggle. This is because of a limitation of Tailwind Config Viewer.
