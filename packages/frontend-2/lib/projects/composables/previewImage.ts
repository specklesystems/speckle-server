import { MaybeRef } from '@vueuse/core'
import { useAuthCookie } from '~~/lib/auth/composables/auth'

/**
 * Get authenticated preview image URL
 * NOTE: Returns base URL during SSR, so make sure you wrap any components that render the image
 * in <ClientOnly> to prevent hydration errors
 */
export function usePreviewImageBlob(previewUrl: MaybeRef<string>) {
  const authToken = useAuthCookie()
  const url = ref(unref(previewUrl))

  if (process.client) {
    watch(
      () => unref(previewUrl),
      async (basePreviewUrl) => {
        const res = await fetch(basePreviewUrl, {
          headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
        })

        if (res.headers.has('X-Preview-Error')) {
          throw new Error('Failed getting preview')
        }

        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        url.value = blobUrl
      },
      { immediate: true }
    )
  }

  return {
    url: computed(() => url.value)
  }
}
