import { get, isObjectLike, isString } from '#lodash'
import { ValueOf } from 'type-fest'
import { WorkspaceLimits } from '../../workspaces/helpers/limits.js'

export type AuthError<ErrorCode extends string = string, Payload = undefined> = {
  readonly code: ErrorCode
  readonly message: string
  readonly payload: Payload
} & Error

export const defineAuthError = <
  ErrorCode extends string,
  Payload = undefined
>(definition: {
  code: ErrorCode
  message: string
}): {
  new (
    ...args: Payload extends undefined
      ? [params?: { message?: string } | string]
      : [params: { payload: Payload; message?: string } | string]
  ): AuthError<ErrorCode, Payload>
  code: ErrorCode
} => {
  return class AuthErrorClass extends Error {
    readonly message: string
    readonly code: ErrorCode
    readonly payload: Payload
    readonly isAuthPolicyError = true

    static code: ErrorCode = definition.code

    constructor(
      ...args: Payload extends undefined
        ? [params?: { message?: string } | string]
        : [params: { payload: Payload; message?: string } | string]
    ) {
      const [params] = args
      const message = isString(params) ? params : params?.message || definition.message
      super(message)

      this.code = definition.code
      this.payload =
        params && !isString(params) && 'payload' in params
          ? params.payload
          : (undefined as Payload)
      this.message = message
      this.name = definition.code + 'Error'
    }
  }
}

export const isAuthPolicyError = (err: unknown): err is AuthError => {
  return isObjectLike(err) && get(err, 'isAuthPolicyError') === true
}

export const ProjectNotFoundError = defineAuthError({
  code: 'ProjectNotFound',
  message: 'Project not found'
})

export const ProjectNoAccessError = defineAuthError({
  code: 'ProjectNoAccess',
  message: 'You do not have access to the project'
})

export const PersonalProjectsLimitedError = defineAuthError({
  code: 'PersonalProjectsLimited',
  message: 'Non-workspaced/personal projects are limited'
})

export const ProjectNotEnoughPermissionsError = defineAuthError({
  code: 'ProjectNotEnoughPermissions',
  message: 'You do not have enough permissions in the project to perform this action'
})

export const ProjectLastOwnerError = defineAuthError({
  code: 'ProjectLastOwner',
  message: 'You are the last owner of this project'
})

export const WorkspacesNotEnabledError = defineAuthError({
  code: 'WorkspacesNotEnabled',
  message: 'This server does not support workspaces'
})

export const WorkspaceNoAccessError = defineAuthError({
  code: 'WorkspaceNoAccess',
  message: 'You do not have access to the workspace'
})

export const WorkspaceNotEnoughPermissionsError = defineAuthError({
  code: 'WorkspaceNotEnoughPermissions',
  message: 'You do not have enough permissions in the workspace to perform this action'
})

export const WorkspaceReadOnlyError = defineAuthError({
  code: 'WorkspaceReadOnly',
  message: 'The workspace is in a read only mode, upgrade your plan to unlock it'
})

export const WorkspaceLimitsReachedError = defineAuthError<
  'WorkspaceLimitsReached',
  { limit: keyof WorkspaceLimits }
>({
  code: 'WorkspaceLimitsReached',
  message: 'Workspace limits have been reached'
})

export const WorkspaceNoFeatureAccessError = defineAuthError({
  code: 'WorkspaceNoFeatureAccess',
  message: 'Your workspace plan does not have access to this feature.'
})

export const WorkspaceProjectMoveInvalidError = defineAuthError({
  code: 'WorkspaceProjectMoveInvalid',
  message: 'Projects already in a workspace cannot be moved to another workspace.'
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

export const WorkspaceNoEditorSeatError = defineAuthError({
  code: 'WorkspaceNoEditorSeat',
  message: 'You need an editor seat to perform this action'
})

export const ServerNoAccessError = defineAuthError({
  code: 'ServerNoAccess',
  message: 'You do not have access to this server'
})

export const ServerNotEnoughPermissionsError = defineAuthError({
  code: 'ServerNotEnoughPermissions',
  message: 'You do not have enough permissions in the server to perform this action'
})

export const ServerNoSessionError = defineAuthError({
  code: 'ServerNoSession',
  message: 'You are not logged in to this server'
})

export const CommentNotFoundError = defineAuthError({
  code: 'CommentNotFound',
  message: 'Comment not found'
})

export const CommentNoAccessError = defineAuthError({
  code: 'CommentNoAccess',
  message: 'You do not have access to this comment'
})

export const ModelNotFoundError = defineAuthError({
  code: 'ModelNotFound',
  message: 'Model not found'
})

export const ReservedModelNotDeletableError = defineAuthError({
  code: 'ReservedModelNotDeletable',
  message: 'This model is reserved and cannot be deleted'
})

export const VersionNotFoundError = defineAuthError({
  code: 'VersionNotFound',
  message: 'Version not found'
})

// Resolve all exported error types
export type AllAuthErrors = ValueOf<{
  [key in keyof typeof import('./authErrors.js')]: typeof import('./authErrors.js')[key] extends new (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => infer R
    ? R
    : never
}>
