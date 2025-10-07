import { isSerializedViewerState } from '@speckle/shared/viewer/state'
import { useViewerRealtimeActivityTracker } from '~/lib/viewer/composables/activity'
import {
  StateApplyMode,
  useApplySerializedState
} from '~/lib/viewer/composables/serialization'
import {
  useInjectedViewerState,
  type InitialSetupState,
  type UseSetupViewerParams
} from '~/lib/viewer/composables/setup'
import type { SavedViewUrlSettings } from '~/lib/viewer/helpers/savedViews'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'

/**
 * Invoke in postSetup
 */
export const useViewerSavedViewIntegration = () => {
  const {
    pageType,
    resources: {
      request: {
        savedView: { id: savedViewId, loadOriginal }
      },
      response: { savedView }
    },
    urlHashState: { savedView: urlHashStateSavedViewSettings },
    ui: {
      savedViews: { savedViewStateId }
    }
  } = useInjectedViewerState()
  const applyState = useApplySerializedState()
  const { serializedStateId } = useViewerRealtimeActivityTracker()
  const { on, emit } = useEventBus()

  const validState = (state: unknown) => (isSerializedViewerState(state) ? state : null)

  const apply = async () => {
    const state = validState(savedView.value?.viewerState)
    if (!state) return

    await applyState(state, StateApplyMode.SavedView, {
      loadOriginal: loadOriginal.value
    })
    savedViewStateId.value = serializedStateId.value
  }

  const update = async (params: { settings: SavedViewUrlSettings }) => {
    const { settings } = params

    let reapplyState = true

    // If passing in viewId and it differs, apply and wait for that to finish
    if (settings.id && settings.id !== savedViewId.value) {
      // wipe hash state, if any exists, otherwise the state will be stale
      await resetUrlHashState()

      // this acts as a reset of the state id too, cause it only applies to active view
      savedViewStateId.value = undefined
      savedViewId.value = settings.id
      reapplyState = false
    }

    // If changing loadOriginal value, apply and wait for that to finish
    if ((settings.loadOriginal || false) !== loadOriginal.value) {
      loadOriginal.value = settings.loadOriginal || false
    }

    // Re-apply current state, if queued
    if (reapplyState && settings.id === savedViewId.value) {
      const state = validState(savedView.value?.viewerState)
      if (!state) return
      await apply()
    }
  }

  const resetUrlHashState = async () => {
    await urlHashStateSavedViewSettings.update(null)
  }

  const reset = async () => {
    // No such thing as a reset in presentation mode - we always have a view active
    if (pageType.value === ViewerRenderPageType.Presentation) return

    savedViewId.value = null
    loadOriginal.value = false
    savedViewStateId.value = undefined
    await resetUrlHashState()
  }

  // Allow force update
  on(ViewerEventBusKeys.ApplySavedView, async (settings) => {
    await update({ settings })
  })

  // Saved view changed, apply
  watch(
    savedView,
    async (newVal, oldVal) => {
      if (!newVal || newVal.id === oldVal?.id) return

      const state = validState(newVal.viewerState)
      if (!state) return

      // If the saved view has changed, apply it
      await apply()
    },
    { immediate: true }
  )

  watch(
    () => serializedStateId.value,
    async (newVal, oldVal) => {
      if (newVal === oldVal) return
      // If the saved view state ID is different from the current serialized state ID (user interaction) -
      // user has changed the state from the view's state
      if (savedViewStateId.value && newVal !== savedViewStateId.value) {
        // emit event that this happened
        if (savedViewId.value)
          emit(ViewerEventBusKeys.UserChangedOpenedView, { viewId: savedViewId.value })

        // reset the saved view - its no longer active
        await reset()
      }
    },
    { immediate: true }
  )
}

export type SavedViewsUIState = ReturnType<typeof useBuildSavedViewsUIState>

export const useBuildSavedViewsUIState = () => {
  const openedGroupState = ref<Map<string, true>>(new Map())
  const savedViewStateId = ref<string>()

  onUnmounted(() => {
    openedGroupState.value = new Map()
  })

  return {
    /**
     * Groups that should currently be expanded/open
     */
    openedGroupState,
    /**
     * A kind of a "viewer snapshot" ID associated w/ the saved view being loaded. Helps track
     * if user has changed the view since loading the saved view
     */
    savedViewStateId
  }
}

export const useBuildSavedViewsCoreState = (
  state: InitialSetupState,
  initParams: UseSetupViewerParams
) => {
  const {
    urlHashState: { savedView: urlHashStateSavedViewSettings }
  } = state

  const savedViewId =
    initParams?.savedView?.id || ref<string | null | undefined>(undefined)
  const loadOriginal = initParams?.savedView?.loadOriginal || ref<boolean>(false)

  // Dont care about urlHashState in presentation mode
  if (state.pageType.value !== ViewerRenderPageType.Presentation) {
    // Usually this watcher would happen in post-setup, but its critical that this is fired
    // early, before any of the GQL queries fire:
    // Url hash state -> core source of truth sync
    watch(
      urlHashStateSavedViewSettings,
      async (newVal) => {
        if ((newVal?.id || null) !== (savedViewId.value || null)) {
          savedViewId.value = newVal?.id || null
        }

        if ((newVal?.loadOriginal || false) !== loadOriginal.value) {
          loadOriginal.value = newVal?.loadOriginal || false
        }
      },
      { immediate: true }
    )
  }

  return {
    id: savedViewId,
    loadOriginal
  }
}
