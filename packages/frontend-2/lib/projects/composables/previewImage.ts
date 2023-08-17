import { MaybeRef } from '@vueuse/core'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { onProjectVersionsPreviewGeneratedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useSubscription } from '@vue/apollo-composable'
import { useLock } from '~~/lib/common/composables/singleton'

const previewUrlProjectIdRegexp = /\/preview\/([\w\d]+)\//i
const previewUrlCommitIdRegexp = /\/commits\/([\w\d]+)/i
const previewUrlObjectIdRegexp = /\/commits\/([\w\d]+)/i

class AngleNotFoundError extends Error {}

/**
 * Get authenticated preview image URL and subscribes to preview image generation events so that the preview image URL
 * is updated whenever generation finishes
 * NOTE: Returns null during SSR, so make sure you wrap any components that render the image
 * in <ClientOnly> to prevent hydration errors
 */
export function usePreviewImageBlob(previewUrl: MaybeRef<string | null | undefined>) {
  const authToken = useAuthCookie()
  const logger = useLogger()

  const url = ref(null as Nullable<string>)
  const panoramaUrl = ref(null as Nullable<string>)
  const isLoadingPanorama = ref(false)
  const shouldLoadPanorama = ref(false)
  const ret = {
    previewUrl: computed(() => url.value),
    panoramaPreviewUrl: computed(() => panoramaUrl.value),
    isLoadingPanorama,
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

  const { hasLock } = useLock(
    computed(() => `useProjectModelUpdateTracking-${unref(previewUrl) || ''}`)
  )
  const { onResult: onProjectPreviewGenerated } = useSubscription(
    onProjectVersionsPreviewGeneratedSubscription,
    () => ({
      id: projectId.value || ''
    }),
    () => ({ enabled: !!projectId.value && hasLock.value })
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
      logger.error('Preview image load error', e)
      url.value = basePreviewUrl || null
    }
  }

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

      const errCode = res.headers.get('X-Preview-Error-Code')
      if (errCode?.length) {
        if (errCode === 'ANGLE_NOT_FOUND') {
          throw new AngleNotFoundError()
        }
      }

      if (res.headers.has('X-Preview-Error')) {
        throw new Error('Failed getting preview')
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      panoramaUrl.value = blobUrl
    } catch (e) {
      if (!(e instanceof AngleNotFoundError)) {
        logger.error('Panorama preview image load error:', e)
      }

      panoramaUrl.value = basePreviewUrl || null
    } finally {
      isLoadingPanorama.value = false
    }
  }

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
  const backgroundImage = computed(() => {
    const screenshot = unref(screenshotData) || 'data:null'
    return `url("${screenshot}")`
  })

  return { backgroundImage, screenshot: unref(screenshotData) }
}
