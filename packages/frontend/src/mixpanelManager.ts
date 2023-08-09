/* eslint-disable camelcase */
import mixpanel, { OverridedMixpanel } from 'mixpanel-browser'
import { Optional } from '@/helpers/typeHelpers'
import { AppLocalStorage } from '@/utils/localStorage'
import * as ThemeStateManager from '@/main/utils/themeStateManager'
import { intersection, mapKeys } from 'lodash'
import { resolveMixpanelServerId } from '@speckle/shared'

let mixpanelInitialized = false

const campaignKeywords = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term'
]

function collectUtmTags() {
  const currentUrl = new URL(window.location.href)
  const foundParams = intersection(
    [...currentUrl.searchParams.keys()],
    campaignKeywords
  )

  const result: Record<string, string> = {}
  for (const campaignParam of foundParams) {
    const value = currentUrl.searchParams.get(campaignParam)
    if (!value) continue
    result[campaignParam] = value
  }

  return result
}

/**
 * Get mixpanel user ID, if user is authenticated and can be identified, or undefined otherwise
 */
export function getMixpanelUserId(): Optional<string> {
  return AppLocalStorage.get('distinct_id') || undefined
}

/**
 * Get mixpanel server identifier
 */
export function getMixpanelServerId(): string {
  return resolveMixpanelServerId(window.location.hostname)
}

/**
 * Get current mixpanel instance
 */
export function getMixpanel(): OverridedMixpanel {
  if (!mixpanelInitialized) {
    throw new Error('Attempting to use uninitialized mixpanel instance')
  }

  return mixpanel
}

/**
 * Initialize MixPanel & identify user
 */
export function initialize(params: {
  hostApp: string
  hostAppDisplayName: string
}): void {
  const mp = mixpanel
  const { hostApp, hostAppDisplayName } = params

  // Register session
  const serverId = getMixpanelServerId()
  mp.register({
    server_id: serverId,
    hostApp
  })

  // Identify user, if any
  const userId = getMixpanelUserId()
  if (userId) {
    mp.identify(userId)
    mp.people.set('Identified', true)
    mp.people.set('Theme Web', ThemeStateManager.isDarkTheme() ? 'dark' : 'light')
    mp.add_group('server_id', serverId)
  }

  // Track UTM
  const utmParams = collectUtmTags()
  if (Object.values(utmParams).length) {
    const firstTouch = mapKeys(utmParams, (_val, key) => `${key} [first touch]`)
    const lastTouch = mapKeys(utmParams, (_val, key) => `${key} [last touch]`)

    mp.people.set(lastTouch)
    mp.people.set_once(firstTouch)
    mp.register(lastTouch)
  }

  // Track app visit
  mp.track(`Visit ${hostAppDisplayName}`)

  mixpanelInitialized = true
}
