import { CSSProperties, Ref } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import {
  LoadedCommentThread,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { reduce } from 'lodash-es'
import { Vector3 } from 'three'
import {
  useSelectionEvents,
  useViewerCameraTracker
} from '~~/lib/viewer/composables/viewer'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import { useWindowResizeHandler } from '~~/lib/common/composables/window'

/**
 * TODO:
 * - z-index issues with thread buttons overlapping threads themselves
 */

graphql(`
  fragment ViewerCommentBubblesData on Comment {
    id
    viewedAt
    data {
      location
      camPos
      sectionBox
      selection
      filters {
        hiddenIds
        isolatedIds
        propertyInfoKey
        passMax
        passMin
        sectionBox
      }
    }
  }
`)

export type ViewerNewThreadBubbleModel = {
  isExpanded: boolean
  isVisible: boolean
  isOccluded: boolean
  style: Partial<CSSProperties>
  clickLocation: Nullable<Vector3>
}

export function useViewerNewThreadBubble(params: {
  parentEl: Ref<Nullable<HTMLElement>>
  block: Ref<boolean>
}) {
  const { parentEl, block } = params

  const buttonState = ref({
    isExpanded: false,
    isVisible: false,
    isOccluded: false,
    clickLocation: null,
    style: {}
  } as ViewerNewThreadBubbleModel)

  const { updatePositions } = useViewerAnchoredPoints({
    parentEl,
    points: computed(() => buttonState.value),
    pointLocationGetter: (b) => b.clickLocation,
    updatePositionCallback: (state, result) => {
      state.isOccluded = result.isOccluded
      state.style = {
        ...state.style,
        ...result.style,
        opacity: state.isOccluded ? '0.8' : '1.0',
        transition: 'all 0.1s ease'
      }
    }
  })

  const closeNewThread = () => {
    buttonState.value.isExpanded = false
    buttonState.value.isVisible = false
    buttonState.value.clickLocation = null
  }

  useSelectionEvents({
    singleClickCallback: (event) => {
      if (block.value) return

      buttonState.value.isExpanded = false
      if (!event || !event.hits.length) {
        closeNewThread()
        return
      }

      buttonState.value.clickLocation = event.hits[0].point.clone()
      buttonState.value.isVisible = true
      updatePositions()
    }
  })

  watch(block, (isBlocked) => {
    if (!isBlocked) return
    closeNewThread()
  })

  return { buttonState }
}

export type CommentBubbleModel = LoadedCommentThread & {
  isExpanded: boolean
  isOccluded: boolean
  style: Partial<CSSProperties>
}

export function useViewerCommentBubbles(params: {
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params
  const {
    resources: {
      response: { commentThreads: commentThreadsBase }
    }
  } = useInjectedViewerState()

  const commentThreads = ref({} as Record<string, CommentBubbleModel>)
  const openThread = computed(() =>
    Object.values(commentThreads.value).find((t) => t.isExpanded)
  )

  // Shallow watcher, only for mapping `commentThreadsBase` -> `commentThreads`
  watch(
    commentThreadsBase,
    (newCommentThreads) => {
      const newModels = reduce(
        newCommentThreads,
        (results, item) => {
          const id = item.id
          results[id] = {
            ...(commentThreads.value[id]
              ? commentThreads.value[id]
              : {
                  isExpanded: false,
                  isOccluded: false,
                  style: {}
                }),
            ...item
          }
          return results
        },
        {} as Record<string, CommentBubbleModel>
      )
      commentThreads.value = newModels
    },
    { immediate: true }
  )

  // Making sure there's only ever 1 expanded thread
  watch(
    () =>
      Object.values(commentThreads.value)
        .filter((t) => t.isExpanded)
        .map((t) => t.id),
    (newExpandedThreadIds, oldExpandedThreadIds) => {
      // If expanding new thread, close old one
      const oldOpenThreadId = oldExpandedThreadIds[0]
      if (!oldOpenThreadId) return

      if (newExpandedThreadIds.length < 2) return

      const finalOpenThread = newExpandedThreadIds.filter(
        (tid) => tid !== oldOpenThreadId
      )[0]
      for (const currentOpenThreadId of newExpandedThreadIds) {
        if (currentOpenThreadId !== finalOpenThread) {
          commentThreads.value[currentOpenThreadId].isExpanded = false
        }
      }
    },
    { deep: true }
  )

  useViewerAnchoredPoints({
    parentEl,
    points: computed(() => Object.values(commentThreads.value)),
    pointLocationGetter: (t) => t.data?.location as Optional<Vector3>,
    updatePositionCallback: (thread, result) => {
      thread.isOccluded = result.isOccluded
      thread.style = {
        ...thread.style,
        ...result.style,
        opacity: thread.isOccluded ? '0.5' : '1.0',
        transition: 'all 0.1s ease'
      }
    }
  })

  return {
    commentThreads,
    openThread
  }
}

/**
 * Responsively switches a comment thread/new-thread container from left side to right side of the button
 * (or vice versa) depending on how much space there is on each side
 */
export function useExpandedThreadResponsiveLocation(params: {
  threadContainer: Ref<Nullable<HTMLElement>>
  width: number
  stopUpdatesBelowWidth?: number
}) {
  const { threadContainer, width } = params
  const stopUpdatesBelowWidth = params.stopUpdatesBelowWidth || width * 2

  const margin = 12
  const leftForShowingOnRightSide = `calc(100% + ${margin}px)`
  const leftForShowingOnLeftSide = `calc(-${width + margin}px)`

  const style = ref({
    top: '50%',
    left: leftForShowingOnRightSide,
    transformOrigin: 'center center',
    transform: 'translateY(-50%)',
    transition: 'all 0.1s ease',
    width: `${width}px`
  })

  const calculateStyle = () => {
    if (!threadContainer.value || process.server) return

    const elRect = threadContainer.value.getBoundingClientRect()
    const showOnLeftSide = elRect.x + elRect.width > window.innerWidth
    const showOnRightSide = elRect.x < 0

    // Screen too small - do nothing
    if (
      (showOnLeftSide && showOnRightSide) ||
      window.innerWidth < stopUpdatesBelowWidth
    )
      return

    if (showOnLeftSide) {
      style.value.left = leftForShowingOnLeftSide
    } else if (showOnRightSide) {
      style.value.left = leftForShowingOnRightSide
    }
  }

  useViewerCameraTracker(() => calculateStyle())
  useWindowResizeHandler(() => calculateStyle())

  watch(threadContainer, (container) => {
    if (container) {
      calculateStyle()
    }
  })

  return {
    style,
    recalculateStyle: calculateStyle
  }
}
