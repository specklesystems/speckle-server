import Vue from 'vue'
import App from './AppAuth.vue'
import router from './router/auth-router'
import vuetify from './plugins/vuetify';
import { createProvider } from './vue-apollo'

Vue.config.productionTip = false

// let urlParams = new URLSearchParams( window.location.search )
// let token = urlParams.get( 'token' )
// if ( token ) {
//   localStorage.setItem( 'AuthToken', token )
// }

// console.log( `Habeamus potentia? ${token}` )

new Vue( {
  router,
  vuetify,
  apolloProvider: createProvider( ),
  render: h => h( App )
} ).$mount( '#app' )