/* eslint-disable camelcase */
import mixpanel, { OverridedMixpanel } from 'mixpanel-browser'
import { Optional } from '@/helpers/typeHelpers'
import { AppLocalStorage } from '@/utils/localStorage'
import md5 from '@/helpers/md5'
import * as ThemeStateManager from '@/main/utils/themeStateManager'

let mixpanelInitialized = false

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
  return md5(window.location.hostname.toLowerCase()).toUpperCase()
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
  mp.register({
    server_id: getMixpanelServerId(),
    hostApp
  })

  // Identify user, if any
  const userId = getMixpanelUserId()
  if (userId) {
    mp.identify(userId)
    mp.people.set('Identified', true)
    mp.people.set('Theme Web', ThemeStateManager.isDarkTheme() ? 'dark' : 'light')
  }

  // Track app visit
  mp.track(`Visit ${hostAppDisplayName}`)

  mixpanelInitialized = true
}
