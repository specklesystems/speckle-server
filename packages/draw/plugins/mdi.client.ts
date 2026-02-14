import { defineNuxtPlugin } from '#app'
import mdiVue from 'mdi-vue/v3'
import * as mdijs from '@mdi/js'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(mdiVue, { icons: mdijs })
})
