import DOMPurify from 'dompurify'
import type { InputValidationRule } from 'vuetify'

export const VALID_EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const VALID_HTTP_URL = /^https?:\/\//

export const required =
  (error = 'This field is required'): InputValidationRule =>
  (val: string) =>
    !!val || error

export const email =
  (error = 'Value must be a valid e-mail address'): InputValidationRule =>
  (val: string) =>
    VALID_EMAIL_REGEX.test(val) || error

export const url =
  (error = 'Value must be a valid URL'): InputValidationRule =>
  (val: string) =>
    VALID_HTTP_URL.test(val) || error

export const maxLength =
  (limit: number, error = 'Value is too long'): InputValidationRule =>
  (val: string) =>
    val.length <= limit || error

export const noXss =
  (error = 'No crazy hacks please'): InputValidationRule =>
  (val: string) => {
    const pure = DOMPurify.sanitize(val)
    if (pure !== val) return error
    return true
  }
