/* eslint-disable camelcase */
import {
  Optional,
  resolveMixpanelUserId,
  resolveMixpanelServerId
} from '@speckle/shared'
import { enableMixpanel, getBaseUrl } from '@/modules/shared/helpers/envHelper'
import Mixpanel from 'mixpanel'
import { mixpanelLogger } from '@/logging/logging'

let client: Optional<Mixpanel.Mixpanel> = undefined
let baseTrackingProperties: Optional<Record<string, string>> = undefined

function getMixpanelServerId(): string {
  const canonicalUrl = getBaseUrl()
  const url = new URL(canonicalUrl)
  return resolveMixpanelServerId(url.hostname)
}

function getBaseTrackingProperties() {
  if (baseTrackingProperties) return baseTrackingProperties
  baseTrackingProperties = {
    server_id: getMixpanelServerId(),
    hostApp: 'serverside'
  }

  return baseTrackingProperties
}

export function initialize() {
  if (client || !enableMixpanel()) return

  client = Mixpanel.init('acd87c5a50b56df91a795e999812a3a4', {
    host: 'analytics.speckle.systems'
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
export function mixpanel(params: { mixpanelUserId: Optional<string> }) {
  const { mixpanelUserId } = params
  const getUserIdentificationProperties = () => ({
    ...(mixpanelUserId
      ? {
          distinct_id: mixpanelUserId
        }
      : {})
  })

  return {
    track: async (eventName: string, extraProperties?: Record<string, unknown>) => {
      const payload = {
        ...getUserIdentificationProperties(),
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
                err: err || false
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

export { resolveMixpanelUserId }
