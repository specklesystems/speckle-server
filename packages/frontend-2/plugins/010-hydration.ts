/**
 * Global ref for checking if app has hydrated
 */
export default defineNuxtPlugin((nuxtApp) => {
  const isAppHydrated = ref(false)

  if (import.meta.client) {
    nuxtApp.hook('app:suspense:resolve', () => {
      isAppHydrated.value = true
    })
  }

  return {
    provide: {
      isAppHydrated
    }
  }
})
