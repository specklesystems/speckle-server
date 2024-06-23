import type { CSSProperties, Ref } from 'vue'
import { SpeckleViewer } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState,
  useResetUiState
} from '~~/lib/viewer/composables/setup'
import type { LoadedCommentThread } from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { debounce } from 'lodash-es'
import { Vector3 } from 'three'
import {
  useOnViewerLoadComplete,
  useSelectionEvents,
  useViewerCameraTracker
} from '~~/lib/viewer/composables/viewer'
import {
  useGetScreenCenterObjectId,
  useViewerAnchoredPoints
} from '~~/lib/viewer/composables/anchorPoints'
import {
  HorizontalDirection,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation
} from '~~/lib/common/composables/window'
import { useViewerUserActivityBroadcasting } from '~~/lib/viewer/composables/activity'
import { useIntervalFn } from '@vueuse/core'
import {
  StateApplyMode,
  useApplySerializedState,
  useStateSerialization
} from '~~/lib/viewer/composables/serialization'
import type { Merge } from 'type-fest'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'

graphql(`
  fragment ViewerCommentBubblesData on Comment {
    id
    viewedAt
    viewerState
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
    },
    camera: { target },
    selection
  } = useInjectedViewerInterfaceState()
  const getCamCenterObjId = useGetScreenCenterObjectId()
  const { setSelectionFromObjectIds } = useSelectionUtilities()
  const logger = useLogger()

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
        opacity: state.isOccluded ? '0.8' : '1.0'
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

  watch(newThreadEditor, (isNewThread, oldIsNewThread) => {
    if (isNewThread && !!isNewThread !== !!oldIsNewThread) {
      if (!buttonState.value.clickLocation && !target.value && !selection.value) {
        logger.warn('Unable to enable new thread editor due to missing position data')
        newThreadEditor.value = false
        return
      }

      // Set "new thread bubble" location & enable it
      if (!buttonState.value.clickLocation) {
        if (target.value) {
          buttonState.value.clickLocation = target.value.clone()
        } else if (selection.value) {
          buttonState.value.clickLocation = selection.value.clone()
        }
      }

      buttonState.value.isExpanded = true
      buttonState.value.isVisible = true
      updatePositions()

      // Also invoke selection, if needed
      if (selection.value) return

      const oid = getCamCenterObjId()
      if (!oid) return
      setSelectionFromObjectIds([oid])
    }
  })

  return { buttonState, closeNewThread }
}

export type CommentBubbleModel = Merge<
  LoadedCommentThread,
  { viewerState: Nullable<SpeckleViewer.ViewerState.SerializedViewerState> }
> & {
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
    pointLocationGetter: (t) => {
      const state = t.viewerState

      const selection = state?.ui.selection
      if (selection?.length) {
        return new Vector3(selection[0], selection[1], selection[2])
      }

      const target = state?.ui.camera.target
      if (target?.length) {
        return new Vector3(target[0], target[1], target[2])
      }

      return undefined
    },
    updatePositionCallback: (thread, result) => {
      thread.isOccluded = result.isOccluded
      thread.style = {
        ...thread.style,
        ...result.style,
        opacity: thread.isOccluded ? '0.5' : '1.0',
        transition: 'all 100ms ease'
      }
    }
  })
}

export function useViewerOpenedThreadUpdateEmitter() {
  if (import.meta.server) return

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
 * Set up auto-focusing on opened thread and setting/unsetting viewer state
 */
export function useViewerThreadTracking() {
  if (import.meta.server) return

  const applyState = useApplySerializedState()
  const { serialize: serializeState } = useStateSerialization()
  const resetState = useResetUiState()

  const state = useInjectedViewerState()
  const {
    ui: {
      threads: { openThread },
      camera: { position, target }
    }
  } = state

  const oldState = ref(
    null as Nullable<SpeckleViewer.ViewerState.SerializedViewerState>
  )

  const refocus = async (
    commentState: SpeckleViewer.ViewerState.SerializedViewerState
  ) => {
    await applyState(commentState, StateApplyMode.ThreadOpen)
  }

  // Do this once viewer loads things
  useOnViewerLoadComplete(({ isInitial }) => {
    const viewerState = openThread.thread.value?.viewerState
    if (SpeckleViewer.ViewerState.isSerializedViewerState(viewerState)) {
      refocus(viewerState)
    }

    // On initial - rewrite old state coords cause they're not valid before initial load
    if (isInitial) {
      const old = oldState.value || serializeState()
      oldState.value = {
        ...old,
        ui: {
          ...old.ui,
          camera: {
            ...old.ui.camera,
            position: position.value.toArray(),
            target: target.value.toArray()
          }
        }
      }
    }
  })

  // Also do this when openThread changes
  watch(openThread.thread, async (newThread, oldThread) => {
    if (newThread?.id !== oldThread?.id) {
      const newState = newThread?.viewerState
      if (newState && SpeckleViewer.ViewerState.isSerializedViewerState(newState)) {
        await refocus(newState)
      } else {
        resetState()
      }
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
    ui: {
      threads: {
        openThread: { isTyping }
      }
    }
  } = useInjectedViewerState()
  const { emitViewing } = useViewerUserActivityBroadcasting()

  const debouncedMarkNoLongerTyping = debounce(
    () => automaticUpdateIsTyping(false),
    7000
  )
  const pauseAutomaticUpdates = ref(false)

  const automaticUpdateIsTyping = (newVal: boolean) => {
    if (pauseAutomaticUpdates.value) return
    updateIsTyping(newVal)
  }

  const updateIsTyping = (newVal: boolean) => {
    if (newVal === isTyping.value) return
    isTyping.value = newVal
  }

  const onKeyDownHandler = () => {
    if (!isTyping.value) {
      automaticUpdateIsTyping(true)
    }
    debouncedMarkNoLongerTyping()
  }

  watch(isTyping, (newVal, oldVal) => {
    if (!!newVal === !!oldVal) return
    emitViewing()
  })
  onBeforeUnmount(() => updateIsTyping(false))
  useOnBeforeWindowUnload(() => updateIsTyping(false))

  return {
    onKeyDownHandler,
    updateIsTyping,
    pauseAutomaticUpdates
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
