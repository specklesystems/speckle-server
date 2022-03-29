import Vue from 'vue'
// Event hub
Vue.prototype.$eventHub = new Vue()

import App from '@/main/App.vue'

import { createProvider } from '@/vue-apollo'
import {
  checkAccessCodeAndGetTokens,
  prefetchUserAndSetSuuid
} from '@/plugins/authHelpers'

import router from '@/main/router/index'
import vuetify from '@/plugins/vuetify'

Vue.config.productionTip = false

import PortalVue from 'portal-vue'
Vue.use(PortalVue)

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import VueFilterDateParse from '@vuejs-community/vue-filter-date-parse'
Vue.use(VueFilterDateParse)

import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format'
Vue.use(VueFilterDateFormat)

import PerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'

Vue.use(PerfectScrollbar)

import VTooltip from 'v-tooltip'
Vue.use(VTooltip, { defaultDelay: 300, defaultBoundariesElement: document.body })

import VueMatomo from 'vue-matomo'

Vue.use(VueMatomo, {
  host: 'https://speckle.matomo.cloud',
  siteId: 4,
  router: router,
  userId: localStorage.getItem('suuid')
})

import VueMixpanel from 'vue-mixpanel'
Vue.use(VueMixpanel, {
  token: 'acd87c5a50b56df91a795e999812a3a4',
  config: {
    // eslint-disable-next-line camelcase
    api_host: 'https://analytics.speckle.systems'
  }
})

// import UniqueId from 'vue-unique-id'
// Vue.use(UniqueId)

import HistogramSlider from 'vue-histogram-slider'
import 'vue-histogram-slider/dist/histogram-slider.css'

Vue.component(HistogramSlider.name, HistogramSlider)

import VueApexCharts from 'vue-apexcharts'
Vue.use(VueApexCharts)

Vue.component('ApexChart', VueApexCharts)

import { formatNumber } from '@/plugins/formatNumber'
// Filter to turn any number into a nice string like '10k', '5.5m'
// Accepts 'max' parameter to set it's formatting while being animated
Vue.filter('prettynum', formatNumber)

// Filter to capitalize words
Vue.filter('capitalize', (value) => {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

// adds various helper methods
import '@/plugins/helpers'

const AuthToken = localStorage.getItem(LocalStorageKeys.AuthToken)
const RefreshToken = localStorage.getItem(LocalStorageKeys.RefreshToken)
const apolloProvider = createProvider()

if (AuthToken) {
  prefetchUserAndSetSuuid(apolloProvider.defaultClient)
    .then(() => {
      initVue()
    })
    .catch(() => {
      if (RefreshToken) {
        // TODO: try to rotate token & prefetch user, etc.
      }
      window.location = `${window.location.origin}/authn/login`
    })
} else {
  checkAccessCodeAndGetTokens()
    .then(() => {
      return prefetchUserAndSetSuuid(apolloProvider.defaultClient)
    })
    .then(() => {
      initVue()
    })
    .catch(() => {
      initVue()
    })
}

import store from '@/main/store'
import { LocalStorageKeys } from '@/helpers/mainConstants'

function initVue() {
  new Vue({
    router,
    vuetify,
    store,
    apolloProvider,
    render: (h) => h(App)
  }).$mount('#app')
}
