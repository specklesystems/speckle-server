import Vue from 'vue'
import App from './EmbedApp.vue'
import vuetify from './embedVuetify'
import { createProvider } from './embedApollo'
import router from './embedRouter'
Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  apolloProvider: createProvider(),
  render: (h) => h(App)
}).$mount('#app')
