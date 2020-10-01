import Vue from 'vue'
import App from './AppFrontend.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import { createProvider, } from './vue-apollo'
import { signIn } from './auth-helpers'
import VueTimeago from 'vue-timeago'


Vue.config.productionTip = false

/* Semicolon of Doom */
;
/* Semicolon of Doom */



( async ( ) => {
  let result = await signIn( )
  if ( !result ) return

  Vue.use( VueTimeago, {
    locale: 'en' } )

  new Vue( {
    router,
    store,
    vuetify,
    apolloProvider: createProvider( ),
    render: h => h( App )
  } ).$mount( '#app' )
} )( )