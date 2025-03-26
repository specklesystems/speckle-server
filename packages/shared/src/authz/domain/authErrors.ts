export type AuthError<ErrorCode extends string = string> = {
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

export const ProjectRoleNotFoundError = defineAuthError({
  code: 'ProjectRoleNotFound',
  message: 'Could not resolve your project role'
})

export const WorkspaceNotFoundError = defineAuthError({
  code: 'WorkspaceNotFound',
  message: 'Workspace not found'
})

export const WorkspaceNoAccessError = defineAuthError({
  code: 'WorkspaceNoAccess',
  message: 'You do not have access to the workspace'
})

export const WorkspaceSsoProviderNotFoundError = defineAuthError({
  code: 'WorkspaceSsoProviderNotFound',
  message: 'The workspace SSO provider was not found'
})

export const WorkspaceSsoSessionInvalidError = defineAuthError({
  code: 'WorkspaceSsoSessionInvalid',
  message: 'Your workspace SSO session is invalid'
})

export const WorkspaceSsoSessionNotFoundError = defineAuthError({
  code: 'WorkspaceSsoSessionNotFound',
  message: 'Your workspace SSO session was not found'
})

export const WorkspaceRoleNotFoundError = defineAuthError({
  code: 'WorkspaceRoleNotFound',
  message: 'The user does not have a role in the workspace'
})

export const ServerRoleNotFoundError = defineAuthError({
  code: 'ServerRoleNotFound',
  message: 'Could not resolve your server role'
})
