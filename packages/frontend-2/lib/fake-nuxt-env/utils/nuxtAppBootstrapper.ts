/* eslint-disable vue/one-component-per-file */
import { RouterLinkMock } from '~~/lib/fake-nuxt-env/components/RouterLinkMock'
import { createNuxtApp, callWithNuxt, useNuxtApp, defineNuxtLink } from '#app'
import { App, defineComponent } from 'vue'

const Head = defineComponent({
  render: () => h('div', { style: { display: 'none' } })
})

const ClientOnly = defineComponent({
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

const NuxtLink = defineNuxtLink({ componentName: 'NuxtLink' })

const setupNuxtApp = (app: App<Element>) => {
  // Setup nuxt singleton, only if it's not already done
  const nuxt = useNuxtApp()
  if (!nuxt) {
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
  } else {
    nuxt.vueApp = app
  }
}

/**
 * Hax upon hax using Nuxt internals over here, but that's what you need to do
 * to get Nuxt-like env setup in Storybook
 */
export const setupVueApp = (app: App<Element>) => {
  setupNuxtApp(app)

  // Implementing & mocking links
  app.component('RouterLink', RouterLinkMock)
  app.component('NuxtLink', NuxtLink)
  app.component('ClientOnly', ClientOnly)
  // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
  app.component('Head', Head)
}
