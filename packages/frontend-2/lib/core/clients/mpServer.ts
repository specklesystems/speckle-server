import {
  fakeMixpanelClient,
  HOST_APP,
  type MixpanelClient
} from '~/lib/common/helpers/mp'
import type Mixpanel from 'mixpanel'
import type { Nullable } from '@speckle/shared'
import * as ServerMixpanelUtils from '@speckle/shared/dist/esm/observability/mixpanel.js'
import { useApiOrigin } from '~/composables/env'
import { useActiveUser } from '~/composables/globals'
import { isFunction } from 'lodash-es'
import { useWaitForActiveUser } from '~/lib/auth/composables/activeUser'

/**
 * IMPORTANT: Do not import this on client-side, the code is only supposed to run in SSR
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
  const { distinctId } = useActiveUser()
  const logger = useLogger()
  const ssrContext = nuxtApp.ssrContext
  const waitForUser = useWaitForActiveUser()

  const baseTrackingProperties = ServerMixpanelUtils.buildBasePropertiesPayload({
    hostApp: HOST_APP,
    serverOrigin: apiOrigin,
    speckleVersion: speckleServerVersion
  })

  return async (): Promise<Nullable<MixpanelClient>> => {
    if (!mixpanelTokenId.length || !mixpanelApiHost.length) {
      return null
    }

    // Init or retrieve the cached client
    const internalClient =
      cachedInternalClient ||
      ServerMixpanelUtils.buildServerMixpanelClient({
        tokenId: mixpanelTokenId,
        apiHostname: new URL(mixpanelApiHost).hostname,
        debug: !!import.meta.dev && logCsrEmitProps
      })
    if (!cachedInternalClient) cachedInternalClient = internalClient

    await waitForUser()

    const coreTrackingProperties = () => {
      return {
        ...baseTrackingProperties,
        ...ServerMixpanelUtils.buildPropertiesPayload({
          distinctId: distinctId.value || undefined,
          headers: ssrContext?.event.node.req.headers,
          query: route.query,
          remoteAddress: ssrContext?.event.node.req.socket.remoteAddress
        })
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
