import '~~/assets/css/tailwind.css'
// import entry from '#app/entry'
import { setup } from '@storybook/vue3'
import { createNuxtApp, callWithNuxt, useNuxtApp } from '#app'

/**
 * Hax upon hax using Nuxt internals over here, but that's what you need to do
 * to get Nuxt-like env setup in Storybook
 */
setup((app) => {
  // Setup nuxt singleton, only if it's not already done
  if (!useNuxtApp()) {
    // Making sure Nuxt knows we're on the client side
    window.process.client = true

    // We can inject nuxt.payload.config through this variable
    // which is necessary cause otherwise `createNuxtApp` throws
    window.__NUXT__ = {
      config: {
        test: 1
        // TODO: public runtimeConfig goes here
      }
    }
    const nuxtApp = createNuxtApp({
      vueApp: app
    })

    // This sets up the global Nuxt singleton, so that it's accessible in `useNuxtApp` etc.
    callWithNuxt(nuxtApp, () => void 0)
  }
})

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  }
}
