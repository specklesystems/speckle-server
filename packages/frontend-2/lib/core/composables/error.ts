import { useScopedState } from '~~/lib/common/composables/scopedState'
import { Observability } from '@speckle/shared'
import type {
  AbstractErrorHandler,
  AbstractUnhandledErrorHandler
} from '~/lib/core/helpers/observability'

const ENTER_STATE_AT_ERRORS_PER_MIN = 100

export function useAppErrorState() {
  const state = useScopedState('appErrorState', () => ({
    inErrorState: ref(false),
    errorRpm: Observability.simpleRpmCounter()
  }))
  const logger = useLogger()

  return {
    isErrorState: computed(() => state.inErrorState.value),
    registerError: () => {
      const epm = state.errorRpm.hit()

      if (!state.inErrorState.value && epm >= ENTER_STATE_AT_ERRORS_PER_MIN) {
        logger.fatal(
          `Too many errors (${epm} errors per minute), entering app error state!`
        )
        state.inErrorState.value = true
      }
    }
  }
}

export type ErrorLoggingTransport = {
  onError: AbstractErrorHandler
  onUnhandledError?: AbstractUnhandledErrorHandler
}

const useErrorLoggingTransportState = () =>
  useScopedState('useErrorLoggingTransport', () => ({
    transports: [] as ErrorLoggingTransport[]
  }))

export const useCreateErrorLoggingTransport = () => {
  const { transports } = useErrorLoggingTransportState()

  return (transport: ErrorLoggingTransport) => {
    transports.push(transport)
    const remove = () => {
      const idx = transports.indexOf(transport)
      if (idx !== -1) {
        transports.splice(idx, 1)
      }
    }

    return remove
  }
}

export const useGetErrorLoggingTransports = () => {
  const { transports } = useErrorLoggingTransportState()
  return transports
}
