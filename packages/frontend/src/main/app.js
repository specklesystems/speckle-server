import Vue from 'vue'
import '@/vueBootstrapper'

import App from '@/main/App.vue'
import store from '@/main/store'
import { LocalStorageKeys } from '@/helpers/mainConstants'

import { createProvider } from '@/vue-apollo'
import {
  checkAccessCodeAndGetTokens,
  prefetchUserAndSetSuuid
} from '@/plugins/authHelpers'

import router from '@/main/router/index'
import vuetify from '@/plugins/vuetify'

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import VueFilterDateParse from '@vuejs-community/vue-filter-date-parse'
Vue.use(VueFilterDateParse)

import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format'
Vue.use(VueFilterDateFormat)

import PerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'

Vue.use(PerfectScrollbar)

// Async HistogramSlider load
Vue.component('HistogramSlider', async () => {
  await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider/dist/histogram-slider.css'
  )
  const component = await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider'
  )
  return component
})

// Async ApexChart load
Vue.component('ApexChart', async () => {
  const VueApexCharts = await import(
    /* webpackChunkName: "vue-apexcharts" */ 'vue-apexcharts'
  )
  Vue.use(VueApexCharts)

  return VueApexCharts
})

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

function initVue() {
  new Vue({
    router,
    vuetify,
    store,
    apolloProvider,
    render: (h) => h(App)
  }).$mount('#app')
}

export { apolloProvider }
