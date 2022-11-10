/* eslint-disable vue/one-component-per-file */
import { RouterLinkMock } from '~~/lib/fake-nuxt-env/components/RouterLinkMock'
import { createNuxtApp, callWithNuxt, useNuxtApp, defineNuxtLink, NuxtApp } from '#app'
import { App, defineComponent } from 'vue'
import { Optional } from '@speckle/shared'

const stubGlobalComponents = (app: App<Element>) => {
  const Head = defineComponent({
    render: () => h('div', { style: { display: 'none' } })
  })

  const ClientOnly = defineComponent({
    setup(_, { slots }) {
      return () => slots.default?.()
    }
  })

  const NuxtLink = defineNuxtLink({ componentName: 'NuxtLink' })

  // Implementing & mocking links
  app.component('RouterLink', RouterLinkMock)
  app.component('NuxtLink', NuxtLink)
  app.component('ClientOnly', ClientOnly)
  // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
  app.component('Head', Head)
}

const initNuxtApp = (vueApp?: App<Element>) => {
  const initVueApp =
    vueApp ||
    ({
      config: {
        globalProperties: {}
      }
    } as App<Element>) // fake, but not really needed at this point

  // Setup nuxt singleton, only if it's not already done
  let nuxt: Optional<NuxtApp> = undefined
  try {
    nuxt = useNuxtApp()
  } catch (e) {
    // suppressed
  }

  if (nuxt) return

  // We can inject nuxt.payload.config through this variable
  // which is necessary cause otherwise `createNuxtApp` throws
  window.__NUXT__ = {
    config: {
      public: {}
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

export const setupVueApp = (app: App<Element>) => {
  // Initializing nuxt singleton
  initNuxtApp(app)

  // Implementing & mocking links
  stubGlobalComponents(app)
}
