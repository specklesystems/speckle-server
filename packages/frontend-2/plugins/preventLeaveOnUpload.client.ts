import { useGlobalFileImportManager } from '~/lib/core/composables/fileImport'

export default defineNuxtPlugin(() => {
  const { hasActiveUploads, unregisterAllActiveUploads } = useGlobalFileImportManager()
  const router = useRouter()

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
})
