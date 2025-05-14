export const ExpectedAuthFailure = {
  UnverifiedEmailSSOLoginError: 'UnverifiedEmailSSOLoginError',
  UserInputError: 'UserInputError',
  InviteNotFoundError: 'InviteNotFoundError'
} as const

export type ExpectedAuthFailure =
  (typeof ExpectedAuthFailure)[keyof typeof ExpectedAuthFailure]
