import { MaybeRef } from '@vueuse/core'
import { Nullable } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { useTheme } from '~~/lib/core/composables/theme'

/**
 * Get authenticated preview image URL
 * NOTE: Returns null during SSR, so make sure you wrap any components that render the image
 * in <ClientOnly> to prevent hydration errors
 */
export function usePreviewImageBlob(previewUrl: MaybeRef<string | null | undefined>) {
  const authToken = useAuthCookie()
  const url = ref(null as Nullable<string>)

  if (process.client) {
    watch(
      () => unref(previewUrl),
      async (basePreviewUrl) => {
        try {
          if (!basePreviewUrl) {
            url.value = null
            return
          }

          const res = await fetch(basePreviewUrl, {
            headers: authToken.value
              ? { Authorization: `Bearer ${authToken.value}` }
              : {}
          })

          if (res.headers.has('X-Preview-Error')) {
            throw new Error('Failed getting preview')
          }

          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          url.value = blobUrl
        } catch (e) {
          console.error('Preview image load error', e)
          url.value = basePreviewUrl || null
        }
      },
      { immediate: true }
    )
  }

  return {
    previewUrl: computed(() => url.value)
  }
}

export function useCommentScreenshotImage(
  screenshotData: MaybeRef<string | null | undefined>
) {
  const { isDarkTheme } = useTheme()
  const backgroundImage = computed(() => {
    const screenshot = unref(screenshotData) || 'data:null'

    const color = isDarkTheme.value
      ? 'rgba(100,115,201,0.33), rgba(25,32,72,0.7)'
      : 'rgba(100,115,231,0.1), rgba(25,32,72,0.05)'

    return `linear-gradient(to right top, ${color}), url("${screenshot}")`
  })

  return { backgroundImage }
}
