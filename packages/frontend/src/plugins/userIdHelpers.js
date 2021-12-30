import Vue from 'vue'

Vue.prototype.$userId = function () {
  return localStorage.getItem('uuid')
}

Vue.prototype.$loggedIn = function () {
  return localStorage.getItem('uuid') !== null
}
