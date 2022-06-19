import Vue from 'vue'
import '@/vueBootstrapper'

import App from './EmbedApp.vue'
import vuetify from './embedVuetify'
import router from './embedRouter'

import '@/plugins/helpers'
import store from '@/main/store'

import { formatNumber } from '@/plugins/formatNumber'
// Filter to turn any number into a nice string like '10k', '5.5m'
// Accepts 'max' parameter to set it's formatting while being animated
Vue.filter('prettynum', formatNumber)

Vue.component('HistogramSlider', async () => {
  await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider/dist/histogram-slider.css'
  )
  const component = await import(
    /* webpackChunkName: "vue-histogram-slider" */ 'vue-histogram-slider'
  )
  return component
})

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App)
}).$mount('#app')
