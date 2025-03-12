export type AuthResult =
  | {
      authorized: true
    }
  | {
      authorized: false
      reason: CheckFailedReason
      message: string
    }

export const authorized = (): AuthResult => ({
  authorized: true
})

const reasonMessages = <const>{
  NoAccessToProject: 'You do not have access to the project',
  WorkspaceNoAccess: 'You do not have access to the workspace',
  WorkspaceSsoSessionInvalid: 'Your workspace SSO session is invalid'
}

export type CheckFailedReason = keyof typeof reasonMessages

export const unauthorized = (reason: CheckFailedReason): AuthResult => ({
  authorized: false,
  reason,
  message: reasonMessages[reason]
})
