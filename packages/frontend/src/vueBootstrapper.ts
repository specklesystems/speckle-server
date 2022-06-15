import Vue from 'vue'
import VTooltip from 'v-tooltip'
import VueMixpanel from 'vue-mixpanel'
import PortalVue from 'portal-vue'

/**
 * Global Vue bootstrapping that is used in all of the frontend apps (main/embed)
 */

// process.env.NODE_ENV is injected by Webpack
Vue.config.productionTip = process.env.NODE_ENV === 'development'

Vue.use(VTooltip, {
  defaultDelay: 300,
  defaultBoundariesElement: document.body,
  defaultHtml: false
})

Vue.use(VueMixpanel, {
  token: 'acd87c5a50b56df91a795e999812a3a4',
  config: {
    // eslint-disable-next-line camelcase
    api_host: 'https://analytics.speckle.systems'
  }
})

Vue.use(PortalVue)

// Event hub
Vue.prototype.$eventHub = new Vue()
