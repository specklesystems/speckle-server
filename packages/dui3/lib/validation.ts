import { ValidationHelpers } from '@speckle/ui-components'
import type { GenericValidateFunction } from 'vee-validate'

export const isEmail = ValidationHelpers.isEmail

export const isOneOrMultipleEmails = ValidationHelpers.isOneOrMultipleEmails

export const isRequired = ValidationHelpers.isRequired

export const isSameAs = ValidationHelpers.isSameAs

export const isStringOfLength = ValidationHelpers.isStringOfLength

export const stringContains = ValidationHelpers.stringContains

export const isUrl = ValidationHelpers.isUrl

export const isItemSelected = ValidationHelpers.isItemSelected

const isValidModelName: GenericValidateFunction<string> = (name) => {
  name = name.trim()
  if (
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.startsWith('#') ||
    name.startsWith('$') ||
    name.indexOf('//') !== -1 ||
    name.indexOf(',') !== -1
  )
    return 'Value should not start with "#", "$", start or end with "/", have multiple slashes next to each other or contain commas'

  if (['globals', 'main'].includes(name))
    return `'main' and 'globals' are reserved names`

  return true
}

export function useModelNameValidationRules() {
  return computed(() => [
    isRequired,
    isStringOfLength({ maxLength: 512 }),
    isValidModelName
  ])
}
