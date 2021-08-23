import Vue from 'vue'
import App from './EmbedApp.vue'
import vuetify from './plugins/vuetifyEmbed'
import { createProvider } from './vue-apollo-embedApp'
import router from './router/embedAppRouter'
Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  apolloProvider: createProvider(),
  render: (h) => h(App)
}).$mount('#app')
