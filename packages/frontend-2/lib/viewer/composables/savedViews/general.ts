import { useAppUrlUtils } from '~/lib/common/composables/url'
import { viewerRoute } from '~/lib/common/helpers/route'
import { useEventBus } from '~/lib/core/composables/eventBus'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { ViewerHashStateKeys } from '~/lib/viewer/composables/setup/urlHashState'
import { ViewerEventBusKeys } from '~/lib/viewer/helpers/eventBus'
import {
  serializeSavedViewUrlSettings,
  type SavedViewUrlSettings
} from '~/lib/viewer/helpers/savedViews'

export const useAreSavedViewsEnabled = () => {
  const {
    public: { FF_SAVED_VIEWS_ENABLED, FF_WORKSPACES_MODULE_ENABLED }
  } = useRuntimeConfig()

  return !!(FF_SAVED_VIEWS_ENABLED && FF_WORKSPACES_MODULE_ENABLED)
}

export const useViewerSavedViewsUtils = () => {
  const {
    projectId,
    resources: {
      request: { resourceIdString }
    }
  } = useInjectedViewerState()
  const { copy } = useClipboard()
  const { buildUrl } = useAppUrlUtils()
  const eventBus = useEventBus()

  const copyLink = async (params: { settings: SavedViewUrlSettings }) => {
    const { settings } = params
    const relativeUrl = viewerRoute(projectId.value, resourceIdString.value, {
      [ViewerHashStateKeys.SavedView]: serializeSavedViewUrlSettings(settings)
    })
    await copy(buildUrl(relativeUrl), {
      successMessage: 'Copied link to view'
    })
  }

  const applyView = (settings: SavedViewUrlSettings) => {
    // Force update, even if the view id is already set
    // (in case this is a frustration click w/ the state not applying)
    eventBus.emit(ViewerEventBusKeys.ApplySavedView, settings)
  }

  return {
    copyLink,
    applyView
  }
}
