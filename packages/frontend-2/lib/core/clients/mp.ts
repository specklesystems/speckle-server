/* eslint-disable camelcase */
import { type Nullable, resolveMixpanelServerId } from '@speckle/shared'
import { isString, mapKeys } from 'lodash-es'
import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import {
  HOST_APP,
  HOST_APP_DISPLAY_NAME,
  type MixpanelClient
} from '~/lib/common/helpers/mp'
import { useTheme } from '~/lib/core/composables/theme'

/**
 * Get mixpanel server identifier
 */
function getMixpanelServerId(): string {
  return resolveMixpanelServerId(window.location.hostname)
}

function useMixpanelUtmCollection() {
  const route = useRoute()
  return () => {
    const campaignKeywords = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term'
    ]

    const result: Record<string, string> = {}
    for (const campaignKeyword of campaignKeywords) {
      const value = route.query[campaignKeyword]
      if (value && isString(value)) {
        result[campaignKeyword] = value
      }
    }

    return result
  }
}

/**
 * Composable that builds the user (re-)identification function. Needs to be invoked on app
 * init and when the active user changes (e.g. after signing out/in)
 */
function useMixpanelUserIdentification() {
  if (import.meta.server) return { reidentify: () => void 0 }

  const { distinctId } = useActiveUser()
  const { isDarkTheme } = useTheme()
  const serverId = getMixpanelServerId()
  const {
    public: { speckleServerVersion }
  } = useRuntimeConfig()

  return {
    reidentify: (mp: MixpanelClient) => {
      // Reset previous user data, if any
      mp.reset()

      // Register session
      mp.register({
        server_id: serverId,
        hostApp: HOST_APP,
        speckleVersion: speckleServerVersion
      })

      // Identify user, if any
      if (distinctId.value) {
        mp.identify(distinctId.value)
        mp.people.set('Identified', true)
        mp.people.set('Theme Web', isDarkTheme.value ? 'dark' : 'light')
        mp.add_group('server_id', serverId)
      }
    }
  }
}

export const useClientsideMixpanelClientBuilder = () => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId, logCsrEmitProps }
  } = useRuntimeConfig()
  const { reidentify } = useMixpanelUserIdentification()
  const onAuthStateChange = useOnAuthStateChange()
  const logger = useLogger()
  const collectUtmTags = useMixpanelUtmCollection()

  return async (): Promise<Nullable<MixpanelClient>> => {
    // Dynamic import to be able to suppress loading errors that happen because of adblock
    const mixpanel = (await import('mixpanel-browser')).default
    if (!mixpanel || !mixpanelTokenId.length || !mixpanelApiHost.length) {
      return null
    }

    // Init
    mixpanel.init(mixpanelTokenId, {
      api_host: mixpanelApiHost,
      debug: !!import.meta.dev && logCsrEmitProps
    })
    const utmParams = collectUtmTags()

    // Reidentify on auth change
    await onAuthStateChange(() => reidentify(mixpanel), { immediate: true })

    // Track UTM (only on initial visit)
    if (Object.values(utmParams).length) {
      const firstTouch = mapKeys(utmParams, (_val, key) => `${key} [first touch]`)
      const lastTouch = mapKeys(utmParams, (_val, key) => `${key} [last touch]`)

      mixpanel.people.set(lastTouch)
      mixpanel.people.set_once(firstTouch)
      mixpanel.register(lastTouch)
    }

    // Track app visit
    mixpanel.track(`Visit ${HOST_APP_DISPLAY_NAME}`)
    logger.info('MP client initialized')

    return mixpanel
  }
}
