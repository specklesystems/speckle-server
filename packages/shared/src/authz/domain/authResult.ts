type AuthSuccess = {
  authorized: true
}

export type AuthFailure<T extends CheckFailedReason> = {
  authorized: false
  code: T
  message: string
}

export type AuthResult<T extends CheckFailedReason> = AuthSuccess | AuthFailure<T>

export const authorized = (): AuthSuccess => ({
  authorized: true
})

const codeMessages = <const>{
  ProjectNotFound: 'Project not found',
  ProjectNoAccess: 'You do not have access to the project',
  WorkspaceNoAccess: 'You do not have access to the workspace',
  WorkspaceSsoSessionInvalid: 'Your workspace SSO session is invalid'
}

export type CheckFailedReason = keyof typeof codeMessages

export const unauthorized = <T extends CheckFailedReason>(code: T): AuthFailure<T> => ({
  authorized: false,
  code,
  message: codeMessages[code]
})
