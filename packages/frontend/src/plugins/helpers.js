import Vue from 'vue'
import md5 from '@/helpers/md5'

Vue.prototype.$userId = function () {
  return localStorage.getItem('uuid')
}

Vue.prototype.$mixpanelId = function () {
  return localStorage.getItem('distinct_id')
}

Vue.prototype.$mixpanelServerId = function () {
  return md5(window.location.hostname.toLowerCase()).toUpperCase()
}

Vue.prototype.$loggedIn = function () {
  return localStorage.getItem('uuid') !== null
}

Vue.prototype.$isMobile = function () {
  return window.matchMedia('(any-hover: none)').matches
}

Vue.prototype.$resourceType = function (resourceId) {
  return resourceId.length === 10 ? 'commit' : 'object'
}

Vue.prototype.$loginAndSetRedirect = function () {
  const currUrl = window.location.href
  localStorage.setItem('shouldRedirectTo', currUrl.replace(window.location.origin, ''))
  this.$router.push('/authn/login')
}
