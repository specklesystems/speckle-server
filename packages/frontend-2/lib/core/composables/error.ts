import { useScopedState } from '~~/lib/common/composables/scopedState'
import * as Observability from '@speckle/shared/dist/esm/observability/index'
import {
  prettify,
  type AbstractLoggerHandler,
  type AbstractLoggerHandlerParams,
  type AbstractUnhandledErrorHandler
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

export type CustomLoggingTransport = {
  onLog?: AbstractLoggerHandler
  onUnhandledError?: AbstractUnhandledErrorHandler
}

const useCustomLoggingTransportState = () =>
  useScopedState('useCustomLoggingTransport', () => ({
    transports: [] as CustomLoggingTransport[]
  }))

export const useCreateLoggingTransport = () => {
  const { transports } = useCustomLoggingTransportState()

  return (transport: CustomLoggingTransport) => {
    if (!transport.onLog && !transport.onUnhandledError) return noop

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

export const useGetLoggingTransports = () => {
  const { transports } = useCustomLoggingTransportState()

  return transports
}

export const useLogToLoggingTransports = () => {
  const transports = useGetLoggingTransports()
  const invokeTransportsWithPayload = (payload: AbstractLoggerHandlerParams) => {
    transports.forEach((handler) => {
      if (!handler.onLog) return
      handler.onLog(payload, {
        prettifyMessage: (msg) => prettify(payload.otherData || {}, msg)
      })
    })
  }

  return {
    transports,
    invokeTransportsWithPayload
  }
}
