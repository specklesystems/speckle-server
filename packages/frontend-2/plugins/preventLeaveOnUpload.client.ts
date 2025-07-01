import { useGlobalFileImportManager } from '~/lib/core/composables/fileImport'

export default defineNuxtPlugin(() => {
  const { hasActiveUploads, unregisterAllActiveUploads } = useGlobalFileImportManager()
  const router = useRouter()

  // Handle nuxt navigation
  router.beforeEach((to, from, next) => {
    // Ignore if same route
    if (to.fullPath === from.fullPath) return next()

    if (hasActiveUploads.value) {
      // eslint-disable-next-line no-alert
      const confirmLeave = window.confirm(
        'An upload is in progress. Are you sure you want to leave?'
      )

      if (confirmLeave) {
        unregisterAllActiveUploads()
      } else {
        return next(false)
      }
    }
    next()
  })

  // Handle the user trying to close the tab or browser
  window.addEventListener('beforeunload', (e) => {
    if (hasActiveUploads.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
})
