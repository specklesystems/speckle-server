import { Optional, resolveMixpanelUserId } from '@speckle/shared'
import * as MixpanelUtils from '@speckle/shared/dist/commonjs/observability/mixpanel.js'
import {
  enableMixpanel,
  getServerOrigin,
  getServerVersion
} from '@/modules/shared/helpers/envHelper'
import Mixpanel from 'mixpanel'
import { mixpanelLogger } from '@/logging/logging'
import type express from 'express'
import type http from 'http'

let client: Optional<Mixpanel.Mixpanel> = undefined
let baseTrackingProperties: Optional<Record<string, string>> = undefined

function getBaseTrackingProperties() {
  if (baseTrackingProperties) return baseTrackingProperties
  baseTrackingProperties = MixpanelUtils.buildBasePropertiesPayload({
    hostApp: 'serverside',
    serverOrigin: getServerOrigin(),
    speckleVersion: getServerVersion()
  })

  return baseTrackingProperties
}

export function initialize() {
  if (client || !enableMixpanel()) return

  client = MixpanelUtils.buildServerMixpanelClient({
    tokenId: 'acd87c5a50b56df91a795e999812a3a4',
    apiHostname: 'analytics.speckle.systems'
  })
}

/**
 * Mixpanel client. Can be undefined if not initialized or disabled. It's advised that you use the mixpanel() helper instead
 * to ensure all of the important properties are sent with all tracking calls.
 */
export function getClient() {
  return client
}

/**
 * Mixpanel tracking helper. An abstraction layer over the client that makes it a bit nicer to work with.
 */
export function mixpanel(params: {
  userEmail: Optional<string>
  req: Optional<express.Request | http.IncomingMessage>
}) {
  const { userEmail, req } = params
  const mixpanelUserId = userEmail?.length
    ? resolveMixpanelUserId(userEmail)
    : undefined

  return {
    track: async (eventName: string, extraProperties?: Record<string, unknown>) => {
      const payload = {
        ...MixpanelUtils.buildPropertiesPayload({
          distinctId: mixpanelUserId,
          query: (req && 'query' in req ? req?.query : {}) || {},
          headers: req?.headers || {},
          remoteAddress: req?.socket?.remoteAddress
        }),
        ...getBaseTrackingProperties(),
        ...(extraProperties || {})
      }

      const client = getClient()
      if (client) {
        return new Promise<void>((resolve, reject) => {
          client.track(eventName, payload, (err) => {
            mixpanelLogger.info(
              {
                eventName,
                payload,
                ...(err ? { err } : {})
              },
              'Mixpanel track() invoked'
            )
            if (err) return reject(err)
            resolve()
          })
        })
      }

      return false
    }
  }
}

export type MixpanelClient = ReturnType<typeof mixpanel>

export { resolveMixpanelUserId }
