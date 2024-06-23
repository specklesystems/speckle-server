import { moduleLogger, Observability } from '@/logging/logging'
import { MaybeAsync } from '@/modules/shared/helpers/typeHelper'
import EventEmitter from 'eventemitter2'

export type ModuleEventEmitterParams = {
  moduleName: string
  /**
   * If you have multiple emitters in a single module, you can use this identify
   * each of them differently
   */
  namespace?: string
}

/**
 * Initialize Speckle Module scoped event emitter. These can be used to make code more SOLID - instead of
 * modifying some code that does X every time you want to do something extra when X occurs, just emit an event
 * there and specify the listening code in a more appropriate module.
 *
 * Example: Instead of comment mentions being sent out from the comment repository's "createComment" function,
 * this repo function emits a COMMENT_CREATED event, that is then handled in a more appropriate module - the speckle
 * Notifications module.
 */
export function initializeModuleEventEmitter<P extends Record<string, unknown>>(
  params: ModuleEventEmitterParams
) {
  const { moduleName, namespace } = params
  const identifier = namespace ? `${moduleName}-${namespace}` : moduleName

  const logger = Observability.extendLoggerComponent(moduleLogger, identifier, 'events')

  const errHandler = (e: unknown) => {
    logger.error(e, `Unhandled ${identifier} event emitter error`)
  }

  const emitter = new EventEmitter()
  emitter.on('uncaughtException', errHandler)
  emitter.on('error', errHandler)

  return {
    /**
     * Emit a module event. This function must be awaited to ensure all listeners
     * execute. Any errors thrown in the listeners will bubble up and throw from
     * the part of code that triggers this emit() call.
     */
    emit: async <K extends keyof P & string>(eventName: K, payload: P[K]) => {
      return (await emitter.emitAsync(eventName, payload)) as unknown[]
    },

    /**
     * Listen for module events. Any errors thrown here will bubble out of where
     * emit() was invoked.
     *
     * @returns Callback for stopping listening
     */
    listen: <K extends keyof P & string>(
      eventName: K,
      handler: (payload: P[K]) => MaybeAsync<void>
    ) => {
      emitter.on(eventName, handler, {
        async: true,
        promisify: true
      })

      return () => {
        emitter.removeListener(eventName, handler)
      }
    },

    /**
     * Destroy event emitter
     */
    destroy() {
      emitter.removeAllListeners()
    },

    /**
     * Debugger scoped to this module event emitter
     */
    logger
  }
}
