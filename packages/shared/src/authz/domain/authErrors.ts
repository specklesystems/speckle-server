type AuthError<ErrorCode extends string> = {
  code: ErrorCode
  message: string
}

export const defineAuthError = <ErrorCode extends string>(params: {
  code: ErrorCode
  message: string
}): AuthError<ErrorCode> => {
  const { code, message } = params

  return {
    code,
    message
  }
}

export const ProjectNotFoundError = defineAuthError({
  code: 'ProjectNotFound',
  message: 'Project not found'
})

export const ProjectNoAccessError = defineAuthError({
  code: 'ProjectNoAccess',
  message: 'You do not have access to the project'
})

export const WorkspaceNoAccessError = defineAuthError({
  code: 'WorkspaceNoAccess',
  message: 'You do not have access to the workspace'
})

export const WorkspaceSsoSessionInvalidError = defineAuthError({
  code: 'WorkspaceSsoSessionInvalid',
  message: 'Your workspace SSO session is invalid'
})
