import Vue from 'vue'
import App from './AppFrontend.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import { createProvider, } from './vue-apollo'
import { signIn } from './auth-helpers'
import VueTimeago from 'vue-timeago'
import VTooltip from 'v-tooltip'


Vue.config.productionTip = false

Vue.use( VueTimeago, {
    locale: 'en' } )
    
Vue.use(VTooltip, { defaultDelay: 300})


  
/* Semicolon of Doom */
;
/* Semicolon of Doom */

( async ( ) => {
  let result = await signIn( )
  if ( !result ) return

  new Vue( {
    router,
    store,
    vuetify,
    apolloProvider: createProvider( ),
    render: h => h( App )
  } ).$mount( '#app' )
} )( )

