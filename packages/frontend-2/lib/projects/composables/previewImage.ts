import type { MaybeRef } from '@vueuse/core'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { onProjectVersionsPreviewGeneratedSubscription } from '~~/lib/projects/graphql/subscriptions'
import { useSubscription } from '@vue/apollo-composable'
import { useLock } from '~~/lib/common/composables/singleton'
import PreviewPlaceholder from '~~/assets/images/preview_placeholder.png'
import { isValidBase64Image } from '@speckle/shared/images/base64'
import { nanoid } from 'nanoid'

/**
 * Eager loading previews ensures a better LCP score, but also hits the preview endpoint more often.
 * Since we don't know the viewport size in SSR, we can just set a limit of how many previews to eager
 * load after which they should use spinners.
 *
 * Theoretically even 1 eager load will fix the LCP issue, but it will look odd if all of the other ones
 * show up as spinners. So ideally just set enough for 1 page load.
 *
 * Assuming a large screen w/ the busiest preview page (project page w/ model grid), there would be
 * about 20 previews
 */
const PREVIEWS_EAGER_LOAD_COUNT = 20

const previewUrlProjectIdRegexp = /\/preview\/([\w\d]+)\//i
const previewUrlCommitIdRegexp = /\/commits\/([\w\d]+)/i
const previewUrlObjectIdRegexp = /\/commits\/([\w\d]+)/i

class AngleNotFoundError extends Error {}

const usePreviewsState = () =>
  useState('preview_images_load_state', () => ({
    /**
     * How many previews have already been eager loaded
     */
    eagerLoadedKeys: new Set<string>()
  }))

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
    /**
     * Whether to avoid spinners and just embed the image immediately. Means we will likely
     * load a lot more than needed, but also get a way better LCP score (no spinners).
     *
     * If enabled, overrides `enabled` to be true.
     */
    eagerLoad: boolean
  }>
) {
  // Checking if we're allowed to eager load
  const { $isAppHydrated } = useNuxtApp()
  const state = usePreviewsState()
  const eagerLoad =
    options?.eagerLoad &&
    !$isAppHydrated.value &&
    state.value.eagerLoadedKeys.size < PREVIEWS_EAGER_LOAD_COUNT
  const eagerLoadKey = nanoid()

  if (eagerLoad) {
    state.value.eagerLoadedKeys.add(eagerLoadKey)
  }

  // Continue on with normal operation
  const { enabled = ref(true) } = options || {}
  const logger = useLogger()
  const lazyLoad = !eagerLoad

  const url = ref<Nullable<string>>(
    (eagerLoad ? unref(previewUrl) : PreviewPlaceholder) || null
  )
  const hasDoneFirstLoad = ref(eagerLoad)
  const panoramaUrl = ref(null as Nullable<string>)
  const isLoadingPanorama = ref(false)
  const shouldLoadPanorama = ref(false)
  const basePanoramaUrl = computed(() => unref(previewUrl) + '/all')
  const isEnabled = computed(() => {
    if (import.meta.server) return true // always true on server
    if (eagerLoad) return true // always true if eagerLoad

    return unref(enabled)
  })
  const cacheBust = ref(0)
  const isPanoramaPlaceholder = ref(false)

  const ret = {
    previewUrl: computed(() => url.value),
    panoramaPreviewUrl: computed(() => panoramaUrl.value),
    isLoadingPanorama,
    shouldLoadPanorama,
    hasDoneFirstLoad: computed(() => hasDoneFirstLoad.value),
    isPanoramaPlaceholder: computed(() => isPanoramaPlaceholder.value)
  }

  // Preload the image
  const directPreviewUrl = unref(previewUrl)
  useHead({
    link: [
      ...(directPreviewUrl?.length
        ? [{ rel: 'preload', as: <const>'image', href: directPreviewUrl }]
        : [])
    ]
  })

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

      if (isValidBase64Image(basePreviewUrl)) {
        // return as is
        url.value = basePreviewUrl
        hasDoneFirstLoad.value = true
        return
      }

      const blobUrlConfig = new URL(basePreviewUrl)
      blobUrlConfig.searchParams.set('v', cacheBust.value.toString())
      const blobUrl = blobUrlConfig.toString()

      // Load img in browser first, before we set the url
      if (import.meta.client && lazyLoad) {
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

      if (isValidBase64Image(basePreviewUrl)) {
        panoramaUrl.value = null // panorama unsupported
        return
      }

      const blobUrlConfig = new URL(basePanoramaUrl.value)
      blobUrlConfig.searchParams.set('v', cacheBust.value.toString())
      const blobUrl = blobUrlConfig.toString()

      // Load img in browser first, before we set the url
      if (import.meta.client) {
        const img = new Image()
        img.src = blobUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        // If width is 700px or less, it's the placeholder not the actual panorama
        isPanoramaPlaceholder.value = img.naturalWidth <= 700
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

  const regeneratePreviews = async (basePreviewUrl?: string) => {
    cacheBust.value++
    await Promise.all([
      processBasePreviewUrl(basePreviewUrl || unref(previewUrl)),
      ...(shouldLoadPanorama.value ? [processPanoramaPreviewUrl()] : [])
    ])
  }

  watch(shouldLoadPanorama, (newVal) => {
    if (newVal) processPanoramaPreviewUrl()
  })

  watch(
    () => unref(previewUrl),
    (newVal) => {
      void regeneratePreviews(newVal || undefined)
    },
    { immediate: true }
  )

  watch(
    () => isEnabled.value,
    (newVal) => {
      if (!newVal) return

      void regeneratePreviews()
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
