import Vue from 'vue'
import SetupApp from './AppSetup.vue'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

new Vue( {
  vuetify,
  render: h => h( SetupApp )
} ).$mount( '#app' )