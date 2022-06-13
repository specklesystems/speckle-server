export const VALID_EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const VALID_HTTP_URL = /^https?:\/\//

/**
 * @callback VuetifyValidator
 * @param {string} value
 * @returns {boolean | string} True if valid / False or string error message if not
 */

/** @returns {VuetifyValidator} */
export const required =
  (error = 'This field is required') =>
  (val) =>
    !!val || error

/** @returns {VuetifyValidator} */
export const email =
  (error = 'Value must be a valid e-mail address') =>
  (val) =>
    VALID_EMAIL_REGEX.test(val) || error

/** @returns {VuetifyValidator} */
export const url =
  (error = 'Value must be a valid URL') =>
  (val) =>
    VALID_HTTP_URL.test(val) || error
