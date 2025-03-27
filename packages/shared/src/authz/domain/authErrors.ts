export type AuthError<ErrorCode extends string = string, Payload = undefined> = {
  readonly code: ErrorCode
  readonly message: string
  readonly payload: Payload
}

export const defineAuthError = <
  ErrorCode extends string,
  Payload = undefined
>(definition: {
  code: ErrorCode
  message: string
}): {
  new (
    ...args: Payload extends undefined
      ? [params?: { message?: string }]
      : [params: { payload: Payload; message?: string }]
  ): AuthError<ErrorCode, Payload>
  code: ErrorCode
} => {
  return class AuthErrorClass {
    readonly message: string
    readonly code: ErrorCode
    readonly payload: Payload

    static code: ErrorCode = definition.code

    constructor(
      ...args: Payload extends undefined
        ? [params?: { message?: string }]
        : [params: { payload: Payload; message?: string }]
    ) {
      const [params] = args

      this.code = definition.code
      this.payload =
        params && 'payload' in params ? params.payload : (undefined as Payload)
      this.message = params?.message || definition.message
    }
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

export const WorkspaceSsoSessionNotFoundError = defineAuthError({
  code: 'WorkspaceSsoSessionNotFound',
  message: 'Your workspace SSO session was not found'
})

export const WorkspaceSsoSessionNoAccessError = defineAuthError<
  'WorkspaceSsoSessionNoAccess',
  {
    workspaceSlug: string
  }
>({
  code: 'WorkspaceSsoSessionNoAccess',
  message: 'Your workspace SSO session is expired or it does not exist'
})

export const WorkspaceRoleNotFoundError = defineAuthError({
  code: 'WorkspaceRoleNotFound',
  message: 'The user does not have a role in the workspace'
})

export const ServerNoAccessError = defineAuthError({
  code: 'ServerNoAccess',
  message: 'You do not have access to this server'
})

export const ServerNoSessionError = defineAuthError({
  code: 'ServerNoSession',
  message: 'You are not logged in to this server'
})

export const ServerRoleNotFoundError = defineAuthError({
  code: 'ServerRoleNotFound',
  message: 'Could not resolve your server role'
})
