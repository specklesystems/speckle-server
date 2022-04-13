import Vue from 'vue'
import App from './EmbedApp.vue'
import vuetify from './embedVuetify'
import router from './embedRouter'

// process.env.NODE_ENV is injected by Webpack
// eslint-disable-next-line no-undef
Vue.config.productionTip = process.env.NODE_ENV === 'development'

import VueMixpanel from 'vue-mixpanel'
Vue.use(VueMixpanel, {
  token: 'acd87c5a50b56df91a795e999812a3a4',
  config: {
    // eslint-disable-next-line camelcase
    api_host: 'https://analytics.speckle.systems'
  }
})

import '@/plugins/helpers'
import store from '@/main/store'

import PortalVue from 'portal-vue'
Vue.use(PortalVue)

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App)
}).$mount('#app')
