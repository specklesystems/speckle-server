import Vue from 'vue'
import '@/vueBootstrapper'

import App from './EmbedApp.vue'
import vuetify from './embedVuetify'
import router from './embedRouter'

import '@/plugins/helpers'
import store from '@/main/store'
import * as MixpanelManager from '@/mixpanelManager'

// Init mixpanel
MixpanelManager.initialize({
  hostApp: 'web-embed',
  hostAppDisplayName: 'Embed App'
})

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App)
}).$mount('#app')
