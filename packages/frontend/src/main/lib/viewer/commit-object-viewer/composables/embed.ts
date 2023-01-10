import { useRoute } from '@/main/lib/core/composables/router'
import {
  buildEmbedUrl,
  EmbedParams,
  wrapUrlInIFrame
} from '@/main/lib/viewer/commit-object-viewer/services/embed'
import { computed, ref, ComputedRef, unref } from 'vue'

/**
 * Get embed viewer query params
 */
export function useEmbedViewerQuery() {
  const route = useRoute()

  /**
   * Main url params
   */
  const streamId = computed(() => (route.query.stream as string) || null)
  const branchName = computed(() => (route.query.branch as string) || null)
  const commitId = computed(() => (route.query.commit as string) || null)
  const objectId = computed(() => (route.query.object as string) || null)

  /**
   * Embed options
   */
  const transparent = computed(() => route.query.transparent === 'true')
  const autoload = computed(() => route.query.autoload === 'true')
  const hideControls = computed(() => route.query.hidecontrols === 'true')
  const noScroll = computed(() => route.query.noscroll === 'true')
  const hideSidebar = computed(() => route.query.hidesidebar === 'true')
  const hideSelectionInfo = computed(() => route.query.hideselectioninfo === 'true')
  const hideLogo = computed(() => route.query.ilovespeckleanyway === 'true')
  const commentSlideShow = computed(() => route.query.commentslideshow === 'true')

  return {
    streamId,
    branchName,
    commitId,
    objectId,
    transparent,
    autoload,
    noScroll,
    hideControls,
    hideSidebar,
    hideSelectionInfo,
    hideLogo,
    commentSlideShow
  }
}

/**
 * Configure a viewer embed URL
 */
export function useEmbedViewerUrlManager(params: {
  embedParams: ComputedRef<EmbedParams>
}) {
  const { embedParams } = params

  const transparent = ref(false)
  const autoload = ref(false)
  const hideControls = ref(false)
  const noScroll = ref(false)
  const hideSidebar = ref(false)
  const hideSelectionInfo = ref(false)
  const hideLogo = ref(false)
  const commentSlideshow = ref(false)
  const options = {
    transparent,
    autoload,
    hideControls,
    noScroll,
    hideSidebar,
    hideSelectionInfo,
    hideLogo,
    commentSlideshow
  }

  const url = computed(() =>
    buildEmbedUrl(unref(embedParams), {
      transparent: transparent.value,
      autoload: autoload.value,
      hideControls: hideControls.value,
      noScroll: noScroll.value,
      hideSidebar: hideSidebar.value,
      hideSelectionInfo: hideSelectionInfo.value,
      hideLogo: hideLogo.value,
      commentSlideshow: commentSlideshow.value
    })
  )

  const iFrameUrl = computed(() => wrapUrlInIFrame(url.value))

  const resetOptions = () => {
    for (const optionRef of Object.values(options)) {
      optionRef.value = false
    }
  }

  return {
    options: {
      transparent,
      autoload,
      hideControls,
      noScroll,
      hideSidebar,
      hideSelectionInfo,
      hideLogo,
      commentSlideshow
    },
    url,
    iFrameUrl,
    resetOptions
  }
}
