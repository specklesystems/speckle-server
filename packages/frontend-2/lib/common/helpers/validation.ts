import { isString } from 'lodash-es'
import { GenericValidateFunction } from 'vee-validate'

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
