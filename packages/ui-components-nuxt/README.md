# ui-components-nuxt

Nuxt v3 module that sets up @speckle/ui-components auto-importing like any other components you might have in your `./components` folder. You also get properly typed components in your templates if you use Volar.

## Setup

1. Make sure you've got `@speckle/ui-components` installed and set up
1. Install `@speckle/ui-components-nuxt` and add it to your nuxt modules in `nuxt.config.ts`

1. Add the following to your `build.transpile` array in your nuxt config:

```js
// nuxt.config.js
export default {
  build: {
    transpile: [
      '@headlessui/vue',
      /^@heroicons\/vue/,
      '@vueuse/core',
      '@vueuse/shared',
      '@speckle/ui-components',
      'v3-infinite-loading'
    ]
  }
}
```

1. Add the following to your `vite.resolve.dedupe` array in your nuxt config:

```js
// nuxt.config.js
export default {
  vite: {
    resolve: {
      dedupe: ['vee-validate']
    }
  }
}
```

This will ensure that some dependencies are transpiled properly so that they work correctly both during SSR & CSR.
