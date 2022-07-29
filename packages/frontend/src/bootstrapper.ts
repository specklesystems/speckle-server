import Vue from 'vue'
import VTooltip from 'v-tooltip'
import VueMixpanel from 'vue-mixpanel'
import PortalVue from 'portal-vue'
import { formatNumber } from '@/plugins/formatNumber'

/**
 * Global bootstrapping that is used in all of the frontend apps (main/embed)
 */

// Filter to turn any number into a nice string like '10k', '5.5m'
// Accepts 'max' parameter to set it's formatting while being animated
Vue.filter('prettynum', formatNumber)

// Async HistogramSlider load
// TODO: Instead of bundling it globally on all pages, only import it where needed
Vue.component('HistogramSlider', async () => {
  await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider/dist/histogram-slider.css'
  )
  const component = await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider'
  )
  return component
})

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
