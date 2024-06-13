/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import Vue from 'vue'
import { getMixpanelUserId, getMixpanelServerId } from '@/mixpanelManager'
import { NotificationEventPayload } from '@/main/lib/core/helpers/eventHubHelper'
import { AppLocalStorage } from '@/utils/localStorage'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import { getInviteTokenFromURL } from '@/main/lib/auth/services/authService'
import { triggerToastNotification } from '@/main/lib/core/composables/notifications'
import { getResourceType } from '@/main/lib/viewer/core/helpers/resourceHelper'
import { setPostAuthRedirect } from '@/main/lib/auth/utils/postAuthRedirectManager'

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
  return getResourceType(resourceId)
}

/**
 * Redirect to log in and redirect back to current page post-login
 */
Vue.prototype.$loginAndSetRedirect = function () {
  if (this.$loggedIn()) return

  // Store current path with all of the query params and everything
  const relativePath = window.location.href.replace(window.location.origin, '')
  setPostAuthRedirect({ pathWithQuery: relativePath })

  // Carry inviteId over
  const token = getInviteTokenFromURL()
  this.$router.push(token ? { path: '/authn/login', query: { token } } : '/authn/login')
}

/**
 * Trigger a toast notification from anywhere
 */
Vue.prototype.$triggerNotification = function (args: NotificationEventPayload) {
  triggerToastNotification(this.$eventHub, args)
}
