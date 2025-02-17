import type { MaybeRef } from '@vueuse/core'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { onProjectVersionsPreviewGeneratedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useSubscription } from '@vue/apollo-composable'
import { useLock } from '~~/lib/common/composables/singleton'
import PreviewPlaceholder from '~~/assets/images/preview_placeholder.png'

const previewUrlProjectIdRegexp = /\/preview\/([\w\d]+)\//i
const previewUrlCommitIdRegexp = /\/commits\/([\w\d]+)/i
const previewUrlObjectIdRegexp = /\/commits\/([\w\d]+)/i

class AngleNotFoundError extends Error {}

/**
 * Get authenticated preview image URL and subscribes to preview image generation events so that the preview image URL
 * is updated whenever generation finishes
 */
export function usePreviewImageBlob(
  previewUrl: MaybeRef<string | null | undefined>,
  options?: Partial<{
    /**
     * Allows disabling the mechanism conditionally (e.g. if image not in viewport)
     */
    enabled: MaybeRef<boolean>
  }>
) {
  const { enabled = ref(true) } = options || {}
  const authToken = useAuthCookie()
  const logger = useLogger()
  const {
    public: { enableDirectPreviews }
  } = useRuntimeConfig()

  const url = ref(PreviewPlaceholder as Nullable<string>)
  const hasDoneFirstLoad = ref(false)
  const panoramaUrl = ref(null as Nullable<string>)
  const isLoadingPanorama = ref(false)
  const shouldLoadPanorama = ref(false)
  const basePanoramaUrl = computed(() => unref(previewUrl) + '/all')
  const isEnabled = computed(() => (import.meta.server ? true : unref(enabled)))
  const cacheBust = ref(0)

  const ret = {
    previewUrl: computed(() => url.value),
    panoramaPreviewUrl: computed(() => panoramaUrl.value),
    isLoadingPanorama,
    shouldLoadPanorama,
    hasDoneFirstLoad: computed(() => hasDoneFirstLoad.value)
  }

  if (enableDirectPreviews) {
    const directPreviewUrl = unref(previewUrl)
    // const directPanoramicUrl = basePanoramaUrl.value

    useHead({
      link: [
        ...(directPreviewUrl?.length
          ? [{ rel: 'preload', as: <const>'image', href: directPreviewUrl }]
          : [])
        // ...(directPanoramicUrl?.length
        //   ? [{ rel: 'prefetch', as: <const>'image', href: directPanoramicUrl }]
        //   : [])
      ]
    })
  }

  if (import.meta.server) return ret

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
    () => ({ enabled: !!projectId.value && hasLock.value && isEnabled.value })
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
      regeneratePreviews()
    }
  })

  async function processBasePreviewUrl(basePreviewUrl: MaybeNullOrUndefined<string>) {
    if (!isEnabled.value) return

    try {
      if (!basePreviewUrl) {
        url.value = PreviewPlaceholder
        hasDoneFirstLoad.value = true
        return
      }

      let blobUrl: string
      if (enableDirectPreviews || import.meta.server) {
        const blobUrlConfig = new URL(basePreviewUrl)
        blobUrlConfig.searchParams.set('v', cacheBust.value.toString())
        blobUrl = blobUrlConfig.toString()
      } else {
        const res = await fetch(basePreviewUrl, {
          headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
        })

        if (res.headers.has('X-Preview-Error')) {
          throw new Error('Failed getting preview')
        }

        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
      }

      // Load img in browser first, before we set the url
      if (import.meta.client) {
        const img = new Image()
        img.src = blobUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      }

      url.value = blobUrl
    } catch (e) {
      logger.error('Preview image load error', e)
      url.value = PreviewPlaceholder
    } finally {
      hasDoneFirstLoad.value = true
    }
  }

  async function processPanoramaPreviewUrl() {
    if (!isEnabled.value) return

    const basePreviewUrl = unref(previewUrl)
    try {
      isLoadingPanorama.value = true
      if (!basePreviewUrl) {
        url.value = PreviewPlaceholder
        return
      }

      let blobUrl: string
      if (enableDirectPreviews || import.meta.server) {
        const blobUrlConfig = new URL(basePanoramaUrl.value)
        blobUrlConfig.searchParams.set('v', cacheBust.value.toString())
        blobUrl = blobUrlConfig.toString()
      } else {
        const res = await fetch(basePanoramaUrl.value, {
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
        blobUrl = URL.createObjectURL(blob)
      }

      // Load img in browser first, before we set the url
      if (import.meta.client) {
        const img = new Image()
        img.src = blobUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      }

      panoramaUrl.value = blobUrl
    } catch (e) {
      if (!(e instanceof AngleNotFoundError)) {
        logger.error('Panorama preview image load error:', e)
      }

      panoramaUrl.value = null
    } finally {
      isLoadingPanorama.value = false
    }
  }

  const regeneratePreviews = (basePreviewUrl?: string) => {
    cacheBust.value++
    processBasePreviewUrl(basePreviewUrl || unref(previewUrl))
    if (shouldLoadPanorama.value) processPanoramaPreviewUrl()
  }

  watch(shouldLoadPanorama, (newVal) => {
    if (newVal) processPanoramaPreviewUrl()
  })

  watch(
    () => unref(previewUrl),
    (newVal) => {
      regeneratePreviews(newVal || undefined)
    },
    { immediate: true }
  )

  watch(
    () => isEnabled.value,
    (newVal) => {
      if (!newVal) return

      regeneratePreviews()
    }
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
