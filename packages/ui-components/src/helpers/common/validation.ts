import { isString, isUndefined } from 'lodash'
import type { GenericValidateFunction } from 'vee-validate'
import { isNullOrUndefined } from '@speckle/shared'

export const VALID_HTTP_URL = /^https?:\/\//
export const VALID_EMAIL = /^[\w-_.+]+@[\w-_.+]+$/

/**
 * Note about new validators:
 * Make sure you use the word "Value" to refer to the value being validated in all error messages, cause the dynamic string replace
 * that replaces that part with the actual field name works based on that
 */

/**
 * E-mail validation rule (not perfect, but e-mails should be validated by sending out confirmation e-mails anyway)
 */
export const isEmail: GenericValidateFunction<string> = (val) =>
  (val || '').match(VALID_EMAIL) ? true : 'Value should be a valid e-mail address'

export const isOneOrMultipleEmails: GenericValidateFunction<string> = (val) => {
  const emails = (val || '').split(',').map((i) => i.trim())
  const valid = emails.every((e) => e.match(VALID_EMAIL))
  return valid || 'Value should be one or multiple comma-delimited e-mail addresses'
}

export const isRequired: GenericValidateFunction<unknown> = (val) => {
  if (isString(val)) {
    val = val.trim()
  }

  return val ? true : 'Value is required'
}

export const isSameAs: (
  otherFieldName: string,
  otherFieldDisplayName?: string
) => GenericValidateFunction<unknown> =
  (otherFieldName, otherFieldDisplayName) => (val, meta) => {
    return val === meta.form[otherFieldName]
      ? true
      : `Value must be the same as in field '${
          otherFieldDisplayName || otherFieldName
        }'`
  }

export const isStringOfLength =
  (params: {
    minLength?: number
    maxLength?: number
  }): GenericValidateFunction<string> =>
  (val) => {
    const { minLength, maxLength } = params
    val = isNullOrUndefined(val) ? '' : val

    if (!isString(val)) return 'Value should be a text string'
    if (!isUndefined(minLength) && val.length < minLength)
      return `Value needs to be at least ${minLength} characters long`
    if (!isUndefined(maxLength) && val.length > maxLength)
      return `Value needs to be no more than ${maxLength} characters long`
    return true
  }

export const stringContains =
  (params: {
    match: string | RegExp
    message: string
  }): GenericValidateFunction<string> =>
  (val) => {
    const { match, message } = params

    if (!isString(val)) return 'Value should be a text string'
    if (!match) return true

    if (isString(match)) {
      return val.includes(match) ? true : message
    } else {
      return match.test(val) ? true : message
    }
  }

export const isUrl: GenericValidateFunction<string> = (value) => {
  if (VALID_HTTP_URL.test(value)) {
    return true
  }
  return 'Value is not a valid URL'
}

export const isItemSelected: GenericValidateFunction<unknown[]> = (val) => {
  if (Array.isArray(val) && val.length > 0) {
    return true
  }
  return 'Value should have at least a single item selected'
}
