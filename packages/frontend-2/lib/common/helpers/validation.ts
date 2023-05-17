import { ValidationHelpers } from '@speckle/ui-components'

export const VALID_HTTP_URL = ValidationHelpers.VALID_HTTP_URL
export const VALID_EMAIL = ValidationHelpers.VALID_EMAIL

/**
 * Note about new validators:
 * Make sure you use the word "Value" to refer to the value being validated in all error messages, cause the dynamic string replace
 * that replaces that part with the actual field name works based on that
 */

/**
 * E-mail validation rule (not perfect, but e-mails should be validated by sending out confirmation e-mails anyway)
 */
export const isEmail = ValidationHelpers.isEmail

export const isOneOrMultipleEmails = ValidationHelpers.isOneOrMultipleEmails

export const isRequired = ValidationHelpers.isRequired

export const isSameAs = ValidationHelpers.isSameAs

export const isStringOfLength = ValidationHelpers.isStringOfLength

export const stringContains = ValidationHelpers.stringContains
