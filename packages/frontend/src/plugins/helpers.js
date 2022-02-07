import Vue from 'vue'
import crypto from 'crypto'

Vue.prototype.$userId = function () {
  return localStorage.getItem('uuid')
}

Vue.prototype.$mixpanelId = function () {
  return localStorage.getItem('distinct_id')
}

Vue.prototype.$mixpanelServerId = function () {
  return crypto
    .createHash('md5')
    .update(window.location.hostname.toLowerCase())
    .digest('hex')
    .toUpperCase()
}

Vue.prototype.$loggedIn = function () {
  return localStorage.getItem('uuid') !== null
}

Vue.prototype.$isMobile = function () {
  return window.matchMedia('(any-hover: none)').matches
}
