import { CSSProperties, Ref } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import {
  InitialStateWithUrlHashState,
  LoadedCommentThread,
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { reduce, difference, debounce } from 'lodash-es'
import { Box3, Vector3 } from 'three'
import {
  useSelectionEvents,
  useViewerCameraTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import {
  HorizontalDirection,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation
} from '~~/lib/common/composables/window'
import { CommentViewerData } from '~~/lib/common/generated/gql/graphql'
import { ViewerEvent } from '@speckle/viewer'
import { useViewerUserActivityBroadcasting } from '~~/lib/viewer/composables/activity'
import { useIntervalFn } from '@vueuse/core'

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

  const {
    threads: {
      openThread: { newThreadEditor }
    }
  } = useInjectedViewerInterfaceState()

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
    singleClickCallback: (_event, { firstVisibleSelectionHit }) => {
      if (block?.value) return

      buttonState.value.isExpanded = false
      if (!firstVisibleSelectionHit) {
        closeNewThread()
        return
      }

      buttonState.value.clickLocation = firstVisibleSelectionHit.point.clone()
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

  watch(
    () => buttonState.value.isExpanded,
    (newVal) => {
      newThreadEditor.value = newVal
    }
  )

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

  // Making sure there's only ever 1 expanded thread & focusedThreadId is linked to these values
  watch(
    () =>
      Object.values(commentThreads.value)
        .filter((t) => t.isExpanded)
        .map((t) => t.id),
    (newExpandedThreadIds, oldExpandedThreadIds) => {
      const completelyNewIds = difference(
        newExpandedThreadIds,
        oldExpandedThreadIds || []
      )
      const finalOpenThreadId =
        (completelyNewIds.length ? completelyNewIds[0] : newExpandedThreadIds[0]) ||
        null

      for (const commentThread of Object.values(commentThreads.value)) {
        const shouldBeExpanded = commentThread.id === finalOpenThreadId
        if (commentThread.isExpanded !== shouldBeExpanded) {
          commentThreads.value[commentThread.id].isExpanded = shouldBeExpanded
        }
      }

      if (focusedThreadId.value !== finalOpenThreadId) {
        focusedThreadId.value = finalOpenThreadId
      }
    },
    { deep: true }
  )

  // Toggling isExpanded when threadIdToOpen changes
  watch(focusedThreadId, (id) => {
    if (id) {
      if (commentThreads.value[id]) commentThreads.value[id].isExpanded = true
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

export function useViewerOpenedThreadUpdateEmitter() {
  if (process.server) return

  const {
    urlHashState: { focusedThreadId }
  } = useInjectedViewerState()
  const { emitViewing } = useViewerUserActivityBroadcasting()

  watch(focusedThreadId, (id, oldId) => {
    if (id !== oldId) {
      emitViewing()
    }
  })
}

/**
 * Set up auto-focusing on opened thread
 */
export function useViewerThreadTracking() {
  if (process.server) return

  const state = useInjectedViewerState()
  const {
    ui: {
      threads: { openThread }
    }
  } = state

  const refocus = (data: CommentViewerData) => {
    if (data.camPos) {
      state.ui.camera.position.value = new Vector3(
        data.camPos[0],
        data.camPos[1],
        data.camPos[2]
      )
      state.ui.camera.target.value = new Vector3(
        data.camPos[3],
        data.camPos[4],
        data.camPos[5]
      )
    }

    if (data.sectionBox) {
      const dataSectionBox = data.sectionBox as {
        min: { x: number; y: number; z: number }
        max: { x: number; y: number; z: number }
      }

      state.ui.sectionBox.value = new Box3(
        new Vector3(dataSectionBox.min.x, dataSectionBox.min.y, dataSectionBox.min.z),
        new Vector3(dataSectionBox.max.x, dataSectionBox.max.y, dataSectionBox.max.z)
      )
    } else {
      state.ui.sectionBox.value = null
    }
  }

  // Do this once viewer loads things
  useViewerEventListener(
    ViewerEvent.LoadComplete,
    () => {
      if (openThread.thread.value?.data) {
        refocus(openThread.thread.value.data)
      }
    },
    { state }
  )

  // Also do this when openThread changes
  watch(openThread.thread, (newThread, oldThread) => {
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

export function useIsTypingUpdateEmitter() {
  const {
    threads: {
      openThread: { isTyping }
    }
  } = useInjectedViewerInterfaceState()
  const { emitViewing } = useViewerUserActivityBroadcasting()

  const debouncedMarkNoLongerTyping = debounce(() => (isTyping.value = false), 7000)

  const updateIsTyping = (newVal: boolean) => {
    if (newVal === isTyping.value) return

    isTyping.value = newVal
    emitViewing()
  }

  const onInputUpdated = () => {
    if (!isTyping.value) {
      isTyping.value = true
    }
    debouncedMarkNoLongerTyping()
  }

  watch(isTyping, emitViewing)
  onBeforeUnmount(() => updateIsTyping(false))
  useOnBeforeWindowUnload(() => updateIsTyping(false))

  return {
    onInputUpdated,
    updateIsTyping
  }
}

export function useAnimatingEllipsis() {
  const baseValue = '.'
  const value = ref(baseValue)

  const { pause, resume } = useIntervalFn(() => {
    if (value.value.length < 3) {
      value.value = value.value + baseValue
    } else {
      value.value = baseValue
    }
  }, 250)

  return { ellipsis: value, controls: { pause, resume } }
}
