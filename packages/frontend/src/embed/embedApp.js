import Vue from 'vue'
import App from './EmbedApp.vue'
import vuetify from './embedVuetify'
import router from './embedRouter'
Vue.config.productionTip = false

import VueMatomo from 'vue-matomo'
Vue.use(VueMatomo, {
  host: 'https://speckle.matomo.cloud',
  siteId: 4,
  router: router
})

import VueMixpanel from 'vue-mixpanel'
Vue.use(VueMixpanel, {
  token: 'acd87c5a50b56df91a795e999812a3a4',
  config: {
    // eslint-disable-next-line camelcase
    api_host: 'https://analytics.speckle.systems'
  }
})

import '@/plugins/helpers'

new Vue({
  router,
  vuetify,
  render: (h) => h(App)
}).$mount('#app')
