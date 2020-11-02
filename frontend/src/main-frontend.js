import Vue from 'vue'
import App from './AppFrontend.vue'

import { createProvider } from './vue-apollo'
import { signIn } from './auth-helpers'

import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

import VueTimeago from 'vue-timeago'
Vue.use( VueTimeago, { locale: 'en' } )

import VTooltip from 'v-tooltip'
Vue.use( VTooltip, { defaultDelay: 300 } )

import VueMatomo from 'vue-matomo'


/* Semicolon of Doom */
;
/* Semicolon of Doom */

( async ( ) => {
  let result = await signIn( )
  if ( !result ) return

  Vue.use( VueMatomo, {
    host: 'https://speckle.matomo.cloud',
    siteId: 4,
    router: router,
    userId: localStorage.getItem( 'suuid' )
  } )

  new Vue( {
    router,
    store,
    vuetify,
    apolloProvider: createProvider( ),
    render: h => h( App )
  } ).$mount( '#app' )
} )( )
