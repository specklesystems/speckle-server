import PortalVue from 'portal-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PortalVue)
})
