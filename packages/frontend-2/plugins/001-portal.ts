import PortalVue from 'portal-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PortalVue)

  if (import.meta.client) {
    const div = document.createElement('div')
    div.id = 'toast-portal'
    document.body.appendChild(div)
  }
})
