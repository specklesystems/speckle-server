import { Serializer } from './utils/Serializer'
import { ServerTransport } from './transports/ServerTransport'
import type { TransportOptions } from './transports/ServerTransport'
import { Base } from './utils/Base'
export { Base }

export { Detach, Chunkable } from './utils/Decorators'

export type SendParams = {
  serverUrl?: string
  projectId: string
  token: string
  logger?: {
    log: (message: unknown) => void
    error: (message: unknown) => void
  }
  options?: {
    transport: TransportOptions
    chunkSize?: number
    hashingFunction?: (s: string) => string
  }
}

export type SendResult = {
  hash: string
  traversed: Record<string, unknown>
}

/**
 * Decomposes, serializes and sends to a speckle server a given object. Note, for objects to be detached, they need to have a 'speckle_type' property.
 * @param object object to decompose, serialise and send to speckle
 * @param parameters: server url, project id and token
 * @returns the hash of the root object and the value of the root object
 */
export const send = async (
  object: Base,
  {
    serverUrl = 'https://app.speckle.systems',
    projectId,
    token,
    logger = console,
    options = undefined
  }: SendParams
) => {
  const t0 = performance.now()
  logger?.log('Starting to send')
  const transport = new ServerTransport(serverUrl, projectId, token, options?.transport)
  const serializer = new Serializer(
    transport,
    options?.chunkSize,
    options?.hashingFunction
  )

  let result: SendResult
  try {
    result = await serializer.write(object)
  } finally {
    transport.dispose()
    serializer.dispose()
  }
  const t1 = performance.now()
  logger.log(`Finished sending in ${(t1 - t0) / 1000}s.`)
  return result
}
