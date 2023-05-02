import {
  useInjectedViewer,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import { SpeckleViewer } from '@speckle/shared'
import { get } from 'lodash-es'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

export function useStateSerialization() {
  const state = useInjectedViewerState()

  const serialize = (): SerializedViewerState => {
    const camControls = state.viewer.instance.cameraHandler.activeCam.controls
    const box = state.viewer.instance.getCurrentSectionBox()

    const ret: SerializedViewerState = {
      projectId: state.projectId.value,
      sessionId: state.sessionId.value,
      viewer: {
        metadata: {
          filteringState: state.viewer.metadata.filteringState.value
            ? {
                passMin: state.viewer.metadata.filteringState.value.passMin,
                passMax: state.viewer.metadata.filteringState.value.passMax
              }
            : null
        }
      },
      resources: {
        request: {
          resourceIdString: state.resources.request.resourceIdString.value,
          threadFilters: { ...state.resources.request.threadFilters.value }
        }
      },
      ui: {
        threads: {
          openThread: {
            threadId: state.ui.threads.openThread.thread.value?.id || null,
            isTyping: state.ui.threads.openThread.isTyping.value,
            newThreadEditor: state.ui.threads.openThread.newThreadEditor.value
          }
        },
        spotlightUserId: state.ui.spotlightUserId.value,
        filters: {
          isolatedObjectIds: state.ui.filters.isolatedObjectIds.value,
          hiddenObjectIds: state.ui.filters.hiddenObjectIds.value,
          selectedObjectIds: state.ui.filters.selectedObjects.value
            .map((o) => o.id)
            .filter(isNonNullable),
          propertyFilter: {
            key: state.ui.filters.propertyFilter.isApplied.value
              ? state.ui.filters.propertyFilter.filter.value?.key || null
              : null
          }
        },
        camera: {
          position: state.ui.camera.position.value.toArray(),
          target: state.ui.camera.target.value.toArray(),
          isOrthoProjection: state.ui.camera.isOrthoProjection.value,
          zoom: (get(camControls, '_zoom') as number) || 1 // kinda hacky, _zoom is a protected prop
        },
        sectionBox: state.ui.sectionBox.value
          ? {
              min: box.min.toArray(),
              max: box.max.toArray()
            }
          : null,
        lightConfig: { ...state.ui.lightConfig.value },
        explodeFactor: state.ui.explodeFactor.value,
        selection: state.ui.selection.value?.toArray() || null
      }
    }
    return ret
  }

  return { serialize }
}
