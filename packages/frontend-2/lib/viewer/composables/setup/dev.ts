import { ViewerEvent } from '@speckle/viewer'
import {
  StateApplyMode,
  useApplySerializedState
} from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'
import type { SpeckleViewer } from '@speckle/shared'
import { get } from 'lodash-es'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useDebugViewerEvents() {
  const logger = useLogger()

  for (const [key, val] of Object.entries(ViewerEvent)) {
    useViewerEventListener(val, (...args) => logger.debug(key, ...args))
  }
}

function useDebugViewer() {
  const state = useInjectedViewerState()
  const apply = useApplySerializedState()
  const {
    viewer: { instance }
  } = state

  // Get current viewer instance
  window.VIEWER = instance

  // Get current viewer state
  window.VIEWER_STATE = () => state

  // Apply viewer state
  window.APPLY_VIEWER_STATE = (
    state: SpeckleViewer.ViewerState.SerializedViewerState
  ) => apply(state, StateApplyMode.TheadFullContextOpen)

  // Apply DD user activity event
  window.APPLY_VIEWER_DD_EVENT = (event: {
    content: {
      attributes: {
        context: { message: { state: SpeckleViewer.ViewerState.SerializedViewerState } }
      }
    }
  }) => {
    const path = 'content.attributes.context.message.state'
    const state = get(event, path)
    if (!state) {
      throw new Error('Cant find serialized state at path: ' + path)
    }

    return apply(state, StateApplyMode.TheadFullContextOpen)
  }
}

export function setupDebugMode() {
  if (import.meta.server) return

  // useDebugViewerEvents()
  useDebugViewer()
}
