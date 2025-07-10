import { useScopedState } from '~~/lib/common/composables/scopedState'
import * as Observability from '@speckle/shared/observability'
import {
  prettify,
  type AbstractLoggerHandler,
  type AbstractLoggerHandlerParams,
  type AbstractUnhandledErrorHandler
} from '~/lib/core/helpers/observability'
import { useRequestId, useServerRequestId } from '~/lib/core/composables/server'
import type dayjs from 'dayjs'
import { nanoid } from 'nanoid'

const ENTER_STATE_AT_ERRORS_PER_MIN = 100

export function useAppErrorState() {
  const state = useScopedState('appErrorState', () => ({
    inErrorState: ref(false),
    errorRpm: Observability.simpleRpmCounter()
  }))
  const nuxtApp = useNuxtApp()

  return {
    isErrorState: computed(() => state.inErrorState.value),
    registerError: () => {
      const epm = state.errorRpm.hit()
      const logger = nuxtApp.$logger

      if (!state.inErrorState.value && epm >= ENTER_STATE_AT_ERRORS_PER_MIN) {
        // optional chaining, cause logger may not exist super early in startup
        logger?.fatal(
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

type CreateErrorReferenceParams = {
  /**
   * Specify date to use in the error reference.
   */
  date: Date | dayjs.Dayjs
  /**
   * Optionally add extra payload to the logger.error() call
   */
  extraPayload?: Record<string, unknown>
}

export const useGenerateErrorReference = () => {
  const logger = useLogger()
  const reqId = useRequestId({ forceFrontendValue: true })
  const serverReqId = useServerRequestId()
  const { copy } = useClipboard()

  const createErrorReference = (params: CreateErrorReferenceParams) => {
    const date = params.date

    let base = `Reference: #${reqId}`
    if (serverReqId.value) base += ` | #${serverReqId.value}`
    base += ` | ${date.toISOString()}`

    if (import.meta.client) {
      base += ` | URL: ${window.location.href}`
    }

    // New ID that will be unique to this copy of the reference and that will cause an error to be logged
    // that we can then easily find by this ID
    const newId = 'fe-error-' + nanoid()
    base += ` | ID: ${newId}`
    logger.error(
      {
        errorId: newId,
        extraPayload: params.extraPayload
      },
      `Error reference logged: ${base}`
    )

    return base
  }

  const copyReference = async (params: CreateErrorReferenceParams) => {
    await copy(createErrorReference(params), {
      successMessage: 'Reference copied. Please include this when contacting support.'
    })
  }

  return {
    createErrorReference,
    copyReference
  }
}
