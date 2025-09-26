export const ExpectedAuthFailure = {
  UnverifiedEmailSSOLoginError: 'UnverifiedEmailSSOLoginError',
  UserInputError: 'UserInputError',
  InviteNotFoundError: 'InviteNotFoundError',
  InvalidGrantError: 'InvalidGrantError',
  BlockedEmailDomainError: 'BlockedEmailDomainError'
} as const

export type ExpectedAuthFailure =
  (typeof ExpectedAuthFailure)[keyof typeof ExpectedAuthFailure]
