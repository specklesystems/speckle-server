import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

export const useDebugPresentationStateIntegration = () => {
  if (import.meta.server) return

  const fullState = useInjectedPresentationState()

  // Get current state
  window.PRESENTATION_STATE = () => fullState
}
