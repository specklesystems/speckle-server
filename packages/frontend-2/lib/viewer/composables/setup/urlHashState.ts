import { useRouteHashState } from '~~/lib/common/composables/url'
import type {
  InitialStateWithInterfaceCore,
  InjectableViewerState
} from '~~/lib/viewer/composables/setup'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId'
}

export function setupUrlHashState(
  state: InitialStateWithInterfaceCore
): InjectableViewerState['ui']['urlHashState'] {
  const { hashState } = useRouteHashState()

  const focusedThreadId = computed({
    get: () => hashState.value[ViewerHashStateKeys.FocusedThreadId] || null,
    set: (newVal) =>
      (hashState.value = {
        ...hashState.value,
        [ViewerHashStateKeys.FocusedThreadId]: newVal
      })
  })

  // Sync URL -> opened thread in viewer
  watch(
    focusedThreadId,
    (newVal) => {
      if (!newVal) {
        state.ui.threads.closeAllThreads()
      } else {
        state.ui.threads.open(newVal)
      }
    },
    { immediate: true }
  )

  // Sync opened thread in viewer -> URL
  watch(
    state.ui.threads.queuedOpenThreadId,
    (openThreadId) => {
      if (focusedThreadId.value === openThreadId) return

      if (!openThreadId) {
        focusedThreadId.value = null
      } else {
        focusedThreadId.value = openThreadId
      }
    },
    { immediate: true }
  )

  return {
    focusedThreadId
  }
}
