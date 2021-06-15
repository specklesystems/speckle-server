import Vue from 'vue'
import App from './App.vue'

import { createProvider } from './vue-apollo'
import { checkAccessCodeAndGetTokens, prefetchUserAndSetSuuid } from './auth-helpers'

import router from './router'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import VueFilterDateParse from '@vuejs-community/vue-filter-date-parse'
Vue.use(VueFilterDateParse)

import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format'
Vue.use(VueFilterDateFormat)

import VTooltip from 'v-tooltip'
Vue.use(VTooltip, { defaultDelay: 300 })

import VueMatomo from 'vue-matomo'

Vue.use(VueMatomo, {
  host: 'https://speckle.matomo.cloud',
  siteId: 4,
  router: router,
  userId: localStorage.getItem('suuid')
})

import VueApexCharts from 'vue-apexcharts'
Vue.use(VueApexCharts)

Vue.component('Apexchart', VueApexCharts)

import { formatNumber } from './formatNumber'
// Filter to turn any number into a nice string like '10k', '5.5m'
// Accepts 'max' parameter to set it's formatting while being animated
Vue.filter('prettynum', formatNumber)

let AuthToken = localStorage.getItem('AuthToken')
let RefreshToken = localStorage.getItem('RefreshToken')

if (AuthToken) {
  prefetchUserAndSetSuuid()
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
      return prefetchUserAndSetSuuid()
    })
    .then(() => {
      initVue()
    })
    .catch(() => {
      initVue()
    })
}

function initVue() {
  new Vue({
    router,
    vuetify,
    apolloProvider: createProvider(),
    render: (h) => h(App)
  }).$mount('#app')
}
