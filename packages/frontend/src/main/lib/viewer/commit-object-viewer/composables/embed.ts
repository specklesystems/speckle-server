import { useRoute } from '@/main/lib/core/composables/router'
import { computed } from 'vue'

/**
 * Get embed viewer query params
 */
export function useEmbedViewerQuery() {
  const route = useRoute()
  const streamId = computed(() => (route.query.stream as string) || null)
  const branchName = computed(() => (route.query.branch as string) || null)
  const commitId = computed(() => (route.query.commit as string) || null)
  const objectId = computed(() => (route.query.object as string) || null)
  const transparent = computed(() => route.query.transparent === 'true')
  const autoload = computed(() => route.query.autoload === 'true')
  const hideControls = computed(() => route.query.hidecontrols === 'true')
  const noScroll = computed(() => route.query.noscroll === 'true')
  const hideSidebar = computed(() => route.query.hidesidebar === 'true')
  const hideSelectionInfo = computed(() => route.query.hideselectioninfo === 'true')
  const hideLogo = computed(() => route.query.ilovespeckleanyway === 'true')
  const commentSlideShow = computed(() => route.query.commentslideshow === 'true')
  const isShooter = computed(() => route.query.doom === 'true')

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
    commentSlideShow,
    isShooter
  }
}
