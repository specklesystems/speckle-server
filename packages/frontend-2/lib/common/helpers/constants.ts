/**
 * Keys for values stored in localStorage
 */
export const LocalStorageKeys = Object.freeze({
  AuthToken: 'AuthToken'
})

/**
 * Key values for JS-accessible cookies
 */
export const CookieKeys = Object.freeze({
  AuthToken: 'authn',
  Theme: 'theme'
})

/**
 * Global event bus event names
 */
export const EventBusEvents = Object.freeze({
  TriggerToast: 'triggerToastNotification',
  ThemeUpdated: 'themeCookieUpdated'
})
