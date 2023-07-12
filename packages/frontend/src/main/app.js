/**
 * Don't export anything out of this file and import it in other files, this borks Vite HMR for some reason
 * (runs app.js twice in the browser)!
 */

import '@/bootstrapper'
import Vue from 'vue'

import App from '@/main/App.vue'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import * as MixpanelManager from '@/mixpanelManager'

import { provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { createProvider, installVueApollo } from '@/config/apolloConfig'
import {
  checkAccessCodeAndGetTokens,
  prefetchUserAndSetID
} from '@/plugins/authHelpers'

import router from '@/main/router/index'
import vuetify from '@/plugins/vuetify'
import VueTimeago from 'vue-timeago'

Vue.use(VueTimeago, { locale: 'en' })

import VueFilterDateParse from '@vuejs-community/vue-filter-date-parse'
Vue.use(VueFilterDateParse)

import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format'
Vue.use(VueFilterDateFormat)

// adds various helper methods
import '@/plugins/helpers'
import { AppLocalStorage } from '@/utils/localStorage'
import { InvalidAuthTokenError } from '@/main/lib/auth/errors'

// Async ApexChart load
Vue.component('ApexChart', async () => {
  const VueApexCharts = await import('vue-apexcharts')
  Vue.use(VueApexCharts)

  return VueApexCharts
})

// Filter to capitalize words
Vue.filter('capitalize', (value) => {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

const apolloProvider = createProvider()
installVueApollo(apolloProvider)

function postAuthInit() {
  // Init mixpanel
  MixpanelManager.initialize({
    hostApp: 'web',
    hostAppDisplayName: 'Web App'
  })

  new Vue({
    router,
    vuetify,
    setup() {
      provide(DefaultApolloClient, apolloProvider.defaultClient)
    },
    render: (h) => h(App)
  }).$mount('#app')
}

async function init() {
  const authToken = AppLocalStorage.get(LocalStorageKeys.AuthToken)

  // no auth token - check if we can resolve it from access code
  if (!authToken) {
    const gotToken = await checkAccessCodeAndGetTokens()
    if (gotToken) {
      // Remove access_code get param from current url
      const url = new URL(window.location.href)
      url.searchParams.delete('access_code')
      window.history.replaceState({}, document.title, url.toString())
    }
  }

  // try to retrieve user info with auth token
  try {
    await prefetchUserAndSetID(apolloProvider.defaultClient)
  } catch (e) {
    if (e instanceof InvalidAuthTokenError) {
      // data retrieval failed and user was logged out - go to login page
      window.location = `${window.location.origin}/authn/login`
      return
    }

    // Log and continue
    console.error(e)
  }

  // Init app
  postAuthInit()
}
init()
