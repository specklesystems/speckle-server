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

export const ProjectWorkspaceRequiredError = defineAuthError({
  code: 'ProjectWorkspaceRequiredError',
  message: 'Projects must be created in a workspace.'
})

export const ServerNoAccessError = defineAuthError({
  code: 'ServerNoAccess',
  message: 'You do not have required access to the server'
})

export const UnauthenticatedError = defineAuthError({
  code: 'Unauthenticated',
  message: 'Missing or invalid authentication info'
})

export const WorkspaceNoAccessError = defineAuthError({
  code: 'WorkspaceNoAccess',
  message: 'You do not have access to the workspace'
})

export const WorkspaceSsoSessionInvalidError = defineAuthError({
  code: 'WorkspaceSsoSessionInvalid',
  message: 'Your workspace SSO session is invalid'
})
