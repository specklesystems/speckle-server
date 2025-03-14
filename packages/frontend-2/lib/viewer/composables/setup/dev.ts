import { ViewerEvent } from '@speckle/viewer'
import {
  StateApplyMode,
  useApplySerializedState,
  useStateSerialization
} from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'
import type { SpeckleViewer } from '@speckle/shared'
import { get, isString } from 'lodash-es'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useDebugViewerEvents() {
  const logger = useLogger()

  for (const [key, val] of Object.entries(ViewerEvent)) {
    useViewerEventListener(val, (...args) => logger.debug(key, ...args))
  }
}

function useDebugViewer() {
  const fullViewerState = useInjectedViewerState()
  const apply = useApplySerializedState()
  const { serialize } = useStateSerialization()
  const {
    viewer: { instance }
  } = fullViewerState

  const ensureObj = <O>(obj: O | string): O => {
    return isString(obj) ? JSON.parse(obj) : obj
  }

  const applyState = (
    state: SpeckleViewer.ViewerState.SerializedViewerState | string
  ) => {
    return apply(ensureObj(state), StateApplyMode.TheadFullContextOpen)
  }

  // Get current viewer instance
  window.VIEWER = instance

  // Get current viewer state
  window.VIEWER_STATE = () => fullViewerState

  // Get serialized version of current state
  window.VIEWER_SERIALIZED_STATE = (...args: Parameters<typeof serialize>) => {
    const serialized = serialize(...args)
    return JSON.stringify(serialized)
  }

  // Apply viewer state
  window.APPLY_VIEWER_STATE = (
    state: SpeckleViewer.ViewerState.SerializedViewerState
  ) => applyState(state)

  // Apply DD user activity event
  window.APPLY_VIEWER_DD_EVENT = (
    event:
      | {
          content: {
            attributes: {
              context: {
                message: { state: SpeckleViewer.ViewerState.SerializedViewerState }
              }
            }
          }
        }
      | string
  ) => {
    event = ensureObj(event)
    const path = 'content.attributes.context.message.state'
    const state = get(event, path)
    if (!state) {
      throw new Error('Cant find serialized state at path: ' + path)
    }

    return applyState(state)
  }
}

export function setupDebugMode() {
  if (import.meta.server) return

  // useDebugViewerEvents()
  useDebugViewer()
}
