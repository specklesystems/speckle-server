import { isString, isUndefined } from 'lodash-es'
import { GenericValidateFunction } from 'vee-validate'
import { isNullOrUndefined } from '@speckle/shared'

/**
 * Note about new validators:
 * Make sure you use the word "Value" to refer to the value being validated in all error messages, cause the dynamic string replace
 * that replaces that part with the actual field name works based on that
 */

/**
 * E-mail validation rule (not perfect, but e-mails should be validated by sending out confirmation e-mails anyway)
 */
export const isEmail: GenericValidateFunction<string> = (val) =>
  (val || '').match(/^[\w-_.]+@[\w-_.]+$/)
    ? true
    : 'Value should be a valid e-mail address'

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
