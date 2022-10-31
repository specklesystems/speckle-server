/* eslint-disable vue/one-component-per-file */
import { RouterLinkMock } from '~~/lib/fake-nuxt-env/components/RouterLinkMock'
import { createNuxtApp, callWithNuxt, useNuxtApp, defineNuxtLink, NuxtApp } from '#app'
import { App, defineComponent } from 'vue'
import apolloPlugin from '~~/lib/fake-nuxt-env/plugins/apollo'
import { Optional } from '@speckle/shared'
import { merge } from 'lodash-es'

const Head = defineComponent({
  render: () => h('div', { style: { display: 'none' } })
})

const ClientOnly = defineComponent({
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

const NuxtLink = defineNuxtLink({ componentName: 'NuxtLink' })

const initNuxtApp = () => {
  const initVueApp = {
    config: {
      globalProperties: {}
    }
  } as App<Element> // fake, but not really needed at this point

  // Setup nuxt singleton, only if it's not already done
  let nuxt: Optional<NuxtApp> = undefined
  try {
    nuxt = useNuxtApp()
  } catch (e) {
    // suppressed
  }

  if (nuxt) return

  // Making sure Nuxt knows we're on the client side
  window.process.client = true

  // We can inject nuxt.payload.config through this variable
  // which is necessary cause otherwise `createNuxtApp` throws
  window.__NUXT__ = {
    config: {
      public: {
        API_ORIGIN: import.meta.env.STORYBOOK_API_ORIGIN
      }
    }
  }
  const nuxtApp = createNuxtApp({
    vueApp: initVueApp
  })

  // This sets up the global Nuxt singleton, so that it's accessible in `useNuxtApp` etc.
  callWithNuxt(nuxtApp, () => void 0)

  return {
    initVueApp
  }
}

const registerVueWithNuxtApp = (app: App<Element>) => {
  const nuxt = useNuxtApp()
  nuxt.vueApp = app
}

/**
 * Prepares async plugin installers and returns a synchronous Vue plugin for configuring the main
 * Vue instance
 *
 * Hax upon hax using Nuxt internals over here, but that's what you need to do
 * to get Nuxt-like env setup in Storybook
 */
export const buildVueAppSetup = async () => {
  const { initVueApp } = initNuxtApp() || {}
  const { vuePlugin } = await apolloPlugin()

  return (app: App<Element>) => {
    // feeding in original app incase any important properties were attached to it
    registerVueWithNuxtApp(initVueApp ? merge(app, initVueApp) : app)

    // Running plugins that currently can't get auto-bootstrapped
    vuePlugin(app)

    // Implementing & mocking links
    app.component('RouterLink', RouterLinkMock)
    app.component('NuxtLink', NuxtLink)
    app.component('ClientOnly', ClientOnly)
    // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
    app.component('Head', Head)
  }
}
