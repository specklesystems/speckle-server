/* eslint-disable camelcase */
import { Optional, resolveMixpanelUserId } from '@speckle/shared'
import { enableMixpanel } from '@/modules/shared/helpers/envHelper'
import Mixpanel from 'mixpanel'

let client: Optional<Mixpanel.Mixpanel> = undefined

export function initialize() {
  if (client || !enableMixpanel()) return

  client = Mixpanel.init('acd87c5a50b56df91a795e999812a3a4', {
    host: 'analytics.speckle.systems'
  })
}

/**
 * Mixpanel client. Can be undefined if not initialized or disabled.
 */
export function getClient() {
  return client
}

/**
 * Mixpanel tracking helper. An abstraction layer over the client that makes it a bit nicer to work with.
 */
export function mixpanel(params: { mixpanelUserId: Optional<string> }) {
  const { mixpanelUserId } = params
  const userIdentificationProperties = () => ({
    ...(mixpanelUserId
      ? {
          distinct_id: mixpanelUserId
        }
      : {})
  })

  return {
    track: (eventName: string, extraProperties?: Record<string, unknown>) => {
      return getClient()?.track(eventName, {
        ...userIdentificationProperties(),
        ...(extraProperties || {})
      })
    }
  }
}

export { resolveMixpanelUserId }
