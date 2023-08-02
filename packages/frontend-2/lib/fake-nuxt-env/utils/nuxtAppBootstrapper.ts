/* eslint-disable vue/one-component-per-file */
import { RouterLinkMock } from '~~/lib/fake-nuxt-env/components/RouterLinkMock'
import { createNuxtApp, callWithNuxt, useNuxtApp, defineNuxtLink, NuxtApp } from '#app'
import { App, defineComponent } from 'vue'
import { Optional } from '@speckle/shared'
import { noop } from 'lodash-es'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PortalVue from 'portal-vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'

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
    // some busted up TS types here
    nuxt = useNuxtApp() as unknown as NuxtApp
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

  // Mocked useRoute() & router (no param & no query)
  nuxtApp['_route'] = { query: {}, params: {} } as RouteLocationNormalizedLoaded
  nuxtApp['$router'] = { resolve: (to: unknown) => to } as Router

  // Fake mixpanel through nuxtApp.$mixpanel
  nuxtApp['$mixpanel'] = (() => ({ track: noop })) as (typeof nuxtApp)['$mixpanel']

  // Fake logger
  nuxtApp['$logger'] = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    fatal: console.error,
    trace: console.debug,
    silent: noop
  } as (typeof nuxtApp)['$logger']

  // This sets up the global Nuxt singleton, so that it's accessible in `useNuxtApp` etc.
  callWithNuxt(nuxtApp, () => void 0)

  return {
    initVueApp
  }
}

export const setupVueApp = (app: App<Element>) => {
  // Initializing nuxt singleton
  initNuxtApp(app)

  // TODO: Implement more DRY plugin reuse
  // Init day.js
  dayjs.extend(relativeTime)

  app.use(VueTippy, {
    defaultProps: {
      arrow: true
    },
    flipDuration: 0
  })

  // Init portal vue
  app.use(PortalVue)

  // Implementing & mocking links
  stubGlobalComponents(app)
}
