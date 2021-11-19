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

new Vue({
  router,
  vuetify,
  render: (h) => h(App)
}).$mount('#app')
