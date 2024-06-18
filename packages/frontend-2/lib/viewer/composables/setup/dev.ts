import { ViewerEvent } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useDebugViewerEvents() {
  const logger = useLogger()

  for (const [key, val] of Object.entries(ViewerEvent)) {
    useViewerEventListener(val, (...args) => logger.debug(key, ...args))
  }
}

function useDebugViewer() {
  const state = useInjectedViewerState()
  const {
    viewer: { instance }
  } = state

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.VIEWER = instance
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.VIEWER_STATE = () => state
}

export function setupDebugMode() {
  if (import.meta.server) return
  if (!import.meta.dev) return

  // useDebugViewerEvents()
  useDebugViewer()
}
