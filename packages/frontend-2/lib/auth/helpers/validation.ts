import { isStringOfLength, stringContains } from '~~/lib/common/helpers/validation'
import { blockedDomains } from '@speckle/shared'

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
export const doesNotContainBlockedDomain = (val: string) => {
  const domain = val.split('@')[1]?.toLowerCase()
  return domain && blockedDomains.includes(domain)
    ? 'Please use your work email instead of a personal email address'
    : true
}

export const passwordRules = [
  passwordLongEnough,
  doesNotContainBlockedDomain,
  passwordHasAtLeastOneNumber,
  passwordHasAtLeastOneLowercaseLetter,
  passwordHasAtLeastOneUppercaseLetter
]
