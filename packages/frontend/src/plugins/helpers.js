import Vue from 'vue'
import md5 from '@/helpers/md5'

let hasLocalStorage = typeof Storage !== 'undefined'

try {
  localStorage.setItem('foo', 'bar')
  localStorage.getItem('foo')
  localStorage.removeItem('foo')
} catch {
  hasLocalStorage = false
}

Vue.prototype.$userId = function () {
  if (hasLocalStorage) return localStorage.getItem('uuid')
  else return null
}

Vue.prototype.$mixpanelId = function () {
  if (hasLocalStorage) return localStorage.getItem('distinct_id')
  else return null
}

Vue.prototype.$mixpanelServerId = function () {
  return md5(window.location.hostname.toLowerCase()).toUpperCase()
}

Vue.prototype.$loggedIn = function () {
  if (hasLocalStorage) return localStorage.getItem('uuid') !== null
  else return null
}

Vue.prototype.$isMobile = function () {
  return window.matchMedia('(any-hover: none)').matches
}

Vue.prototype.$resourceType = function (resourceId) {
  return resourceId.length === 10 ? 'commit' : 'object'
}

Vue.prototype.$loginAndSetRedirect = function () {
  const currUrl = window.location.href
  if (hasLocalStorage)
    localStorage.setItem(
      'shouldRedirectTo',
      currUrl.replace(window.location.origin, '')
    )
  this.$router.push('/authn/login')
}
