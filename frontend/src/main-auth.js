import Vue from 'vue'
import App from './AppAuth.vue'
import router from './router'
import vuetify from './plugins/vuetify';
import { createProvider } from './vue-apollo'

Vue.config.productionTip = false

new Vue( {
  router,
  vuetify,
  apolloProvider: createProvider( ),
  render: h => h( App )
} ).$mount( '#app' )