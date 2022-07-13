import Vue from 'vue'
import { getMixpanelUserId, getMixpanelServerId } from '@/mixpanelManager'
import { NotificationEventPayload } from '@/main/lib/core/helpers/eventHubHelper'
import { AppLocalStorage } from '@/utils/localStorage'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import { getInviteIdFromURL } from '@/main/lib/auth/services/authService'

Vue.prototype.$userId = function () {
  return AppLocalStorage.get(LocalStorageKeys.Uuid)
}

Vue.prototype.$mixpanelId = function () {
  return getMixpanelUserId()
}

Vue.prototype.$mixpanelServerId = function () {
  return getMixpanelServerId()
}

Vue.prototype.$loggedIn = function () {
  return !!AppLocalStorage.get(LocalStorageKeys.Uuid)
}

Vue.prototype.$isMobile = function () {
  return window.matchMedia('(any-hover: none)').matches
}

Vue.prototype.$resourceType = function (resourceId: string) {
  return resourceId.length === 10 ? 'commit' : 'object'
}

/**
 * Redirect to log in and redirect back to current page post-login
 */
Vue.prototype.$loginAndSetRedirect = function () {
  // Store current path with all of the query params and everything
  const relativePath = window.location.href.replace(window.location.origin, '')
  AppLocalStorage.set(LocalStorageKeys.ShouldRedirectTo, relativePath)

  // Carry inviteId over
  const inviteId = getInviteIdFromURL()
  this.$router.push(
    inviteId ? { path: '/authn/login', query: { inviteId } } : '/authn/login'
  )
}

/**
 * Trigger a toast notification from anywhere
 */
Vue.prototype.$triggerNotification = function (args: NotificationEventPayload) {
  this.$eventHub.$emit('notification', args)
}
