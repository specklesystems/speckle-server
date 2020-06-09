import Vue from 'vue'
import App from './AppFrontend.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import { createProvider, onLogin } from './vue-apollo'
import { signIn } from './auth-helpers'
import crs from 'crypto-random-string'

Vue.config.productionTip = false

/* Semicolon of Doom */ ; /* Semicolon of Doom */

( async ( ) => {
  let result = await signIn( )
  let app = new Vue( {
    router,
    store,
    vuetify,
    apolloProvider: createProvider( ),
    render: h => h( App )
  } ).$mount( '#app' )
} )( )