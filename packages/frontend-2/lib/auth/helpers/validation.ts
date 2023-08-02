import { isStringOfLength, stringContains } from '~~/lib/common/helpers/validation'

export const passwordLongEnough = isStringOfLength({ minLength: 8 })
export const passwordHasAtLeastOneNumber = stringContains({
  match: /\d/,
  message: 'Must have at least one number'
})
export const passwordHasAtLeastOneLowercaseLetter = stringContains({
  match: /[a-z]/,
  message: 'Must have at least one lowercase letter'
})
export const passwordHasAtLeastOneUppercaseLetter = stringContains({
  match: /[A-Z]/,
  message: 'Must have at least one uppercase letter'
})

export const passwordRules = [
  passwordLongEnough,
  passwordHasAtLeastOneNumber,
  passwordHasAtLeastOneLowercaseLetter,
  passwordHasAtLeastOneUppercaseLetter
]
