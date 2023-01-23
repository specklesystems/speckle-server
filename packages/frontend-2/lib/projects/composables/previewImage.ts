import { MaybeRef } from '@vueuse/core'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { useTheme } from '~~/lib/core/composables/theme'
import { onVersionPreviewGeneratedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useSubscription } from '@vue/apollo-composable'

const previewVersionUrlRegexp = /\/commits\/([\w\d]+)$/i

/**
 * Get authenticated preview image URL
 * NOTE: Returns null during SSR, so make sure you wrap any components that render the image
 * in <ClientOnly> to prevent hydration errors
 */
export function usePreviewImageBlob(previewUrl: MaybeRef<string | null | undefined>) {
  const authToken = useAuthCookie()
  const url = ref(null as Nullable<string>)
  const ret = {
    previewUrl: computed(() => url.value)
  }

  if (process.server) return ret

  const previewVersionId = computed(() => {
    const basePreviewUrl = unref(previewUrl)
    if (!basePreviewUrl) return null

    const urlObj = new URL(basePreviewUrl)
    const previewPath = urlObj.pathname
    const [, versionId] = previewVersionUrlRegexp.exec(previewPath) || [null, null]
    return versionId
  })

  const { onResult: onVersionPreviewGenerated } = useSubscription(
    onVersionPreviewGeneratedSubscription,
    () => ({
      versionId: previewVersionId.value || ''
    }),
    () => ({ enabled: !!previewVersionId.value })
  )

  onVersionPreviewGenerated((res) => {
    if (!res.data?.versionPreviewGenerated) return

    // Regenerate
    processBasePreviewUrl(unref(previewUrl))
  })

  async function processBasePreviewUrl(basePreviewUrl: MaybeNullOrUndefined<string>) {
    try {
      if (!basePreviewUrl) {
        url.value = null
        return
      }

      const res = await fetch(basePreviewUrl, {
        headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
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
  }

  watch(() => unref(previewUrl), processBasePreviewUrl, { immediate: true })

  return ret
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
