type AuthSuccess = {
  authorized: true
}

export type AuthFailure<T extends CheckFailedReason> = {
  authorized: false
  reason: T
  message: string
}

export type AuthResult<T extends CheckFailedReason> = AuthSuccess | AuthFailure<T>

export const authorized = (): AuthSuccess => ({
  authorized: true
})

const reasonMessages = <const>{
  ProjectNotFound: 'Project not found',
  ProjectNoAccess: 'You do not have access to the project',
  WorkspaceNoAccess: 'You do not have access to the workspace',
  WorkspaceSsoSessionInvalid: 'Your workspace SSO session is invalid'
}

export type CheckFailedReason = keyof typeof reasonMessages

export const unauthorized = <T extends CheckFailedReason>(
  reason: T
): AuthFailure<T> => ({
  authorized: false,
  reason,
  message: reasonMessages[reason]
})
