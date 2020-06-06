import Vue from 'vue'
import App from './AppAuth.vue'
import router from './router/auth-router'
import vuetify from './plugins/vuetify';
import { createProvider } from './vue-apollo'

Vue.config.productionTip = false

let urlParams = new URLSearchParams( window.location.search )
let appId = urlParams.get( 'appId' ) || 'spklwebapp'
let token = urlParams.get( 'token' )
let refreshToken = urlParams.get( 'refreshToken' )

console.log( 'main init' )
console.log( `token: ${token}; appid: ${appId} ` )
console.log( `main init end` )
if ( token )
  localStorage.setItem( 'AuthToken', token )

new Vue( {
  router,
  vuetify,
  apolloProvider: createProvider( ),
  render: h => h( App )
} ).$mount( '#app' )