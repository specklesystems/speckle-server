import { getContext } from 'unctx'
import { consola, type ConsolaInstance } from 'consola'
import { AsyncLocalStorage } from 'node:async_hooks'

interface DevLogsServerContext {
  consola: ConsolaInstance
}

const asyncContext = getContext<DevLogsServerContext>('nuxt-dev-logs', {
  asyncContext: true,
  AsyncLocalStorage
})

/**
 * Importing `consola` from a nuxt plugin scope will give us a different instance. We have to pass through the nitro version
 * through an async context.
 */
export default defineNitroPlugin((nitroApp) => {
  if (!import.meta.dev) return

  const handler = nitroApp.h3App.handler
  nitroApp.h3App.handler = (event) => {
    return asyncContext.callAsync({ consola }, () => handler(event))
  }
})
