import { CSSProperties, Ref } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import {
  InitialStateWithUrlHashState,
  InjectableViewerState,
  LoadedCommentThread,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { reduce } from 'lodash-es'
import { Vector3 } from 'three'
import {
  useSelectionEvents,
  useViewerCameraTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import {
  HorizontalDirection,
  useResponsiveHorizontalDirectionCalculation
} from '~~/lib/common/composables/window'
import { CommentViewerData } from '~~/lib/common/generated/gql/graphql'
import { ViewerEvent } from '@speckle/viewer'

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
  block?: Ref<boolean>
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
      if (block?.value) return

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

  if (block) {
    watch(block, (isBlocked) => {
      if (!isBlocked) return
      closeNewThread()
    })
  }

  return { buttonState, closeNewThread }
}

export type CommentBubbleModel = LoadedCommentThread & {
  isExpanded: boolean
  isOccluded: boolean
  style: Partial<CSSProperties> & { x?: number; y?: number }
}

export function useViewerCommentBubblesProjection(params: {
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params
  const {
    ui: {
      threads: { items: commentThreads }
    }
  } = useInjectedViewerState()

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
}

export function useViewerCommentBubbles(
  options?: Partial<{
    state: InitialStateWithUrlHashState
  }>
) {
  const {
    resources: {
      response: { commentThreads: commentThreadsBase }
    },
    urlHashState: { focusedThreadId }
  } = options?.state || useInjectedViewerState()

  const commentThreads = ref({} as Record<string, CommentBubbleModel>)
  const openThread = computed(() =>
    Object.values(commentThreads.value).find((t) => t.isExpanded)
  )

  useSelectionEvents(
    {
      singleClickCallback: (eventInfo) => {
        if ((eventInfo && eventInfo?.hits.length === 0) || !eventInfo) {
          // Close open thread
          // Object.values(commentThreads.value).forEach((t) => (t.isExpanded = false))
        }
      }
    },
    { state: options?.state }
  )

  const closeAllThreads = () => {
    focusedThreadId.value = null
  }

  const open = (id: string) => {
    if (id === focusedThreadId.value) return
    focusedThreadId.value = id
  }

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
            ...item,
            isExpanded: !!(focusedThreadId.value && id === focusedThreadId.value)
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

  // Toggling isExpanded when threadIdToOpen changes
  watch(focusedThreadId, (id) => {
    if (id) {
      if (commentThreads.value[id])
        commentThreads.value[id].isExpanded = !commentThreads.value[id].isExpanded
    } else {
      Object.values(commentThreads.value).forEach((t) => (t.isExpanded = false))
    }
  })

  return {
    commentThreads,
    openThread,
    closeAllThreads,
    open
  }
}

/**
 * Set up auto-focusing on opened thread
 */
export function useViewerThreadTracking(state: InjectableViewerState) {
  if (process.server) return

  const {
    ui: {
      threads: { openThread }
    }
  } = state

  const refocus = (data: CommentViewerData) => {
    if (data.camPos) {
      state.viewer.instance.setView({
        position: new Vector3(data.camPos[0], data.camPos[1], data.camPos[2]),
        target: new Vector3(data.camPos[3], data.camPos[4], data.camPos[5])
      })
    }

    if (data.sectionBox) {
      state.ui.sectionBox.setSectionBox(
        data.sectionBox as {
          min: { x: number; y: number; z: number }
          max: { x: number; y: number; z: number }
        },
        0
      )
      if (!state.ui.sectionBox.isSectionBoxEnabled.value)
        state.ui.sectionBox.sectionBoxOn()
    } else {
      state.ui.sectionBox.sectionBoxOff()
    }
  }

  // Do this once viewer loads things
  useViewerEventListener(
    ViewerEvent.LoadComplete,
    () => {
      if (openThread.value?.data) {
        refocus(openThread.value.data)
      }
    },
    { state }
  )

  // Also do this when openThread changes
  watch(openThread, (newThread, oldThread) => {
    if (newThread?.id && newThread.id !== oldThread?.id && newThread.data) {
      refocus(newThread.data)
    }
  })
}

/**
 * Responsively switches a comment thread/new-thread container from left side to right side of the button
 * (or vice versa) depending on how much space there is on each side
 */
export function useExpandedThreadResponsiveLocation(params: {
  threadContainer: Ref<Nullable<HTMLElement>>
  width: number
  stopUpdatesBelowWidth?: number
  position?: { x: number; y: number }
}) {
  const { threadContainer, width } = params
  const stopUpdatesBelowWidth = params.stopUpdatesBelowWidth || width * 2

  const margin = 12
  const leftForShowingOnRightSide = `calc(100% + ${margin}px)`
  const leftForShowingOnLeftSide = `calc(-${width + margin}px)`

  const { direction, recalculateDirection } =
    useResponsiveHorizontalDirectionCalculation({
      el: threadContainer,
      defaultDirection: HorizontalDirection.Right,
      stopUpdatesBelowWidth
    })

  const style = computed(() => ({
    top: '50%',
    left:
      direction.value === HorizontalDirection.Right
        ? leftForShowingOnRightSide
        : leftForShowingOnLeftSide,
    transformOrigin: 'center center',
    transform: 'translateY(-50%)',
    transition: 'all 0.1s ease',
    width: `${width}px`
  }))

  useViewerCameraTracker(() => recalculateDirection())

  return {
    style,
    recalculateStyle: recalculateDirection
  }
}
