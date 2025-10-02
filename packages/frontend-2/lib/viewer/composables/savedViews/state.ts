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
    urlHashState: { savedView: urlHashStateSavedViewSettings }
  } = useInjectedViewerState()
  const applyState = useApplySerializedState()
  const { serializedStateId } = useViewerRealtimeActivityTracker()
  const { on, emit } = useEventBus()

  // Saved View ID will be unset, once the user does anything to the viewer that
  // changes it from the saved view
  const savedViewStateId = ref<string>()

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
    // In presentation mode, we don't reset the saved view ID since we always have a view active
    if (pageType.value !== ViewerRenderPageType.Presentation) {
      savedViewId.value = null
      loadOriginal.value = false
      await resetUrlHashState()
    }

    // Always reset the saved view state ID when user changes the view
    savedViewStateId.value = undefined
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

  onUnmounted(() => {
    openedGroupState.value = new Map()
  })

  return {
    /**
     * Groups that should currently be expanded/open
     */
    openedGroupState
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
