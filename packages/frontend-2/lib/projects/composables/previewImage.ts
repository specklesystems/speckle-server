import { MaybeRef } from '@vueuse/core'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { useTheme } from '~~/lib/core/composables/theme'
import { onProjectVersionsPreviewGeneratedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useSubscription } from '@vue/apollo-composable'

const previewUrlProjectIdRegexp = /\/preview\/([\w\d]+)\//i
const previewUrlCommitIdRegexp = /\/commits\/([\w\d]+)/i
const previewUrlObjectIdRegexp = /\/commits\/([\w\d]+)/i

/**
 * Get authenticated preview image URL and subscribes to preview image generation events so that the preview image URL
 * is updated whenever generation finishes
 * NOTE: Returns null during SSR, so make sure you wrap any components that render the image
 * in <ClientOnly> to prevent hydration errors
 */
export function usePreviewImageBlob(previewUrl: MaybeRef<string | null | undefined>) {
  const authToken = useAuthCookie()
  const url = ref(null as Nullable<string>)
  const panoramaUrl = ref(null as Nullable<string>)
  const isLoadingPanorama = ref(false)
  const shouldLoadPanorama = ref(false)
  const ret = {
    previewUrl: computed(() => url.value),
    panoramaPreviewUrl: computed(() => panoramaUrl.value),
    isLoadingPanorama,
    processPanoramaPreviewUrl,
    shouldLoadPanorama
  }

  if (process.server) return ret

  const previewUrlPath = computed(() => {
    const basePreviewUrl = unref(previewUrl)
    if (!basePreviewUrl) return null

    const urlObj = new URL(basePreviewUrl)
    return urlObj.pathname
  })

  const projectId = computed(() => {
    const path = previewUrlPath.value
    if (!path) return null
    const [, val] = previewUrlProjectIdRegexp.exec(path) || [null, null]
    return val
  })

  const versionId = computed(() => {
    const path = previewUrlPath.value
    if (!path) return null
    const [, val] = previewUrlCommitIdRegexp.exec(path) || [null, null]
    return val
  })

  const objectId = computed(() => {
    const path = previewUrlPath.value
    if (!path) return null
    const [, val] = previewUrlObjectIdRegexp.exec(path) || [null, null]
    return val
  })

  const { onResult: onProjectPreviewGenerated } = useSubscription(
    onProjectVersionsPreviewGeneratedSubscription,
    () => ({
      id: projectId.value || ''
    }),
    () => ({ enabled: !!projectId.value })
  )

  onProjectPreviewGenerated((res) => {
    const message = res.data?.projectVersionsPreviewGenerated
    if (!message) return

    let regenerate = false
    if (objectId.value && objectId.value === message.objectId) {
      regenerate = true
    } else if (versionId.value && versionId.value === message.versionId) {
      regenerate = true
    }

    if (regenerate) {
      processBasePreviewUrl(unref(previewUrl))
      if (shouldLoadPanorama) processPanoramaPreviewUrl()
    }
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

  // TODO:
  // return out a shouldLoadPanorama = ref(false)

  async function processPanoramaPreviewUrl() {
    const basePreviewUrl = unref(previewUrl)
    try {
      isLoadingPanorama.value = true
      if (!basePreviewUrl) {
        url.value = null
        return
      }

      const res = await fetch(basePreviewUrl + '/all', {
        headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
      })

      if (res.headers.has('X-Preview-Error')) {
        throw new Error('Failed getting preview')
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      panoramaUrl.value = blobUrl
    } catch (e) {
      console.error('Panorama preview image load error', e)
      panoramaUrl.value = basePreviewUrl || null
    } finally {
      isLoadingPanorama.value = false
    }
  }

  // watcher on should load pan => processPanoramama....

  watch(shouldLoadPanorama, (newVal) => {
    if (newVal) processPanoramaPreviewUrl()
  })

  watch(
    () => unref(previewUrl),
    (newVal) => {
      processBasePreviewUrl(newVal)
      if (shouldLoadPanorama.value) processPanoramaPreviewUrl()
    },
    { immediate: true }
  )

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
