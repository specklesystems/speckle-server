import Vue from 'vue'
import SetupApp from './AppSetup.vue'
import vuetify from './plugins/vuetify'
import { createProvider } from './vue-apollo'

Vue.config.productionTip = false

new Vue( {
  vuetify,
  apolloProvider: createProvider( ),
  render: h => h( SetupApp )
} ).$mount( '#app' )