/* eslint-disable camelcase */
import {
  fakeMixpanelClient,
  HOST_APP,
  type MixpanelClient
} from '~/lib/common/helpers/mp'
import Mixpanel from 'mixpanel'
import type { Nullable, Optional } from '@speckle/shared'
import { resolveMixpanelServerId } from '@speckle/shared'
import { useApiOrigin } from '~/composables/env'
import { useActiveUser } from '~/composables/globals'
import { isFunction } from 'lodash-es'
import UAParser from 'ua-parser-js'
import { useWaitForActiveUser } from '~/lib/auth/composables/activeUser'

/**
 * TODO: Move this to shared so that `server` can benefit from the same setup
 */

/**
 * IMPORTANT: Do not import this on client-side, the code is only supposed to run in the browser
 */

let cachedInternalClient: Nullable<Mixpanel.Mixpanel> = null

/**
 * Composable for building the SSR mixpanel client
 */
export const useServersideMixpanelClientBuilder = () => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId, logCsrEmitProps, speckleServerVersion }
  } = useRuntimeConfig()
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const apiOrigin = useApiOrigin({ forcePublic: true })
  const apiHostname = new URL(apiOrigin).hostname
  const mixpanelServerId = resolveMixpanelServerId(apiHostname)
  const { distinctId } = useActiveUser()
  const logger = useLogger()
  const ssrContext = nuxtApp.ssrContext
  const waitForUser = useWaitForActiveUser()

  const baseTrackingProperties = {
    server_id: mixpanelServerId,
    hostApp: HOST_APP,
    speckleVersion: speckleServerVersion
  }

  return async (): Promise<Nullable<MixpanelClient>> => {
    if (!Mixpanel || !mixpanelTokenId.length || !mixpanelApiHost.length) {
      return null
    }

    // Init or retrieve the cached client
    const internalClient =
      cachedInternalClient ||
      Mixpanel.init(mixpanelTokenId, {
        host: new URL(mixpanelApiHost).hostname,
        debug: !!import.meta.dev && logCsrEmitProps
      })
    if (!cachedInternalClient) cachedInternalClient = internalClient

    await waitForUser()

    const coreTrackingProperties = () => {
      const userProps = distinctId.value ? { distinct_id: distinctId.value } : {}

      // User agent
      const userAgentString = ssrContext?.event.node.req.headers[
        'user-agent'
      ] as Optional<string>
      const uaParser = userAgentString ? new UAParser(userAgentString) : null
      const uaProps = uaParser
        ? {
            $browser: uaParser.getBrowser().name,
            $device: uaParser.getDevice().model,
            $os: uaParser.getOS().name
          }
        : {}

      // Referer
      const refererHeader = ssrContext?.event.node.req.headers[
        'referer'
      ] as Optional<string>
      const refererDomain = refererHeader ? new URL(refererHeader).hostname : null
      const refererProps = {
        ...(refererHeader ? { $referrer: refererHeader } : {}),
        ...(refererDomain ? { $referring_domain: refererDomain } : {})
      }

      // Utm
      const utmKeys = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term'
      ]
      const utmProps = utmKeys.reduce((acc, key) => {
        const value = route.query[key] as Optional<string>
        return value ? { ...acc, [key]: value } : acc
      }, {})

      // Remote addr
      const remoteAddr =
        (ssrContext?.event.node.req.headers['x-forwarded-for'] as Optional<string>) ||
        ssrContext?.event.node.req.socket.remoteAddress
      const remoteAddrProps = remoteAddr ? { ip: remoteAddr } : {}

      return {
        ...baseTrackingProperties,
        ...userProps,
        ...uaProps,
        ...refererProps,
        ...utmProps,
        ...remoteAddrProps
      }
    }

    const track: MixpanelClient['track'] = (eventName, properties, optsOrCallback) => {
      const payload = { ...coreTrackingProperties(), ...properties }
      internalClient.track(eventName, payload, (err) => {
        if (isFunction(optsOrCallback)) {
          optsOrCallback(
            err ? { error: err.message, status: 0 } : { error: null, status: 1 }
          )
        }
        logger.info(
          {
            eventName,
            payload,
            ...(err ? { err } : {})
          },
          'SSR Mixpanel track() invoked'
        )
      })
    }

    // TODO: Test, remove!
    track(`Visit from backend!`)

    return {
      ...fakeMixpanelClient(),
      track,
      identify: () => {
        logger.info(
          'SSR Mixpanel identify() invoked, but skipped due to identification being automatic'
        )
      },
      register: () => {
        logger.info(
          'SSR Mixpanel register() invoked, but skipped due to registration being automatic'
        )
      }
    }
  }
}
