import { Scopes, Roles } from '@/modules/core/helpers/mainConstants'
import { getRolesFactory } from '@/modules/shared/repositories/roles'

import type { BaseError } from '@/modules/shared/errors'
import {
  ForbiddenError,
  UnauthorizedError,
  ContextError,
  DatabaseError,
  NotFoundError
} from '@/modules/shared/errors'
import type {
  AvailableRoles,
  MaybeNullOrUndefined,
  ServerRoles,
  StreamRoles
} from '@speckle/shared'
import { Authz } from '@speckle/shared'
import { isResourceAllowed } from '@/modules/core/helpers/token'
import type { UserRoleData } from '@/modules/shared/domain/rolesAndScopes/types'
import db from '@/db/knex'
import type {
  AuthContext,
  AuthParams,
  AuthResult,
  AuthData
} from '@/modules/shared/domain/authz/types'
import type { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import type {
  ValidateServerRoleBuilder,
  ValidateStreamRoleBuilder
} from '@/modules/shared/domain/authz/operations'
import type { GetRoles } from '@/modules/shared/domain/rolesAndScopes/operations'
import type { ValidateUserServerRole } from '@/modules/shared/domain/operations'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { moduleAuthLoaders } from '@/modules/index'

export type { AuthContext, AuthParams }

export interface AuthFailedResult extends AuthResult {
  authorized: false
  error: BaseError | null
  fatal?: boolean
}

export const isAuthFailedResult = (result: AuthResult): result is AuthFailedResult =>
  ('error' in result || ('fatal' in result && !!result.fatal)) && !result.authorized

interface AuthFailedData extends AuthData {
  authResult: AuthFailedResult
}

export const authFailed = (
  context: AuthContext,
  error: BaseError | null,
  fatal = false
): AuthFailedData => ({
  context,
  authResult: { authorized: false, error, fatal }
})

export const authSuccess = (context: AuthContext): AuthData => ({
  context,
  authResult: { authorized: true }
})

export type AuthPipelineFunction = ({
  context,
  authResult,
  params
}: AuthData) => Promise<AuthData>

export const authHasFailed = (authResult: AuthResult): authResult is AuthFailedResult =>
  'error' in authResult

interface RoleValidationInput<T extends AvailableRoles> {
  requiredRole: T
  rolesLookup: () => Promise<UserRoleData<T>[]>
  iddqd: T
  roleGetter: (context: AuthContext) => T | null
}

export function validateRole<T extends AvailableRoles>({
  requiredRole,
  rolesLookup,
  iddqd,
  roleGetter
}: RoleValidationInput<T>): AuthPipelineFunction {
  return async ({ context, authResult }): Promise<AuthData> => {
    let roles: UserRoleData<T>[]
    try {
      roles = await rolesLookup()
    } catch (e) {
      if (e instanceof DatabaseError) {
        return authFailed(context, e)
      }
      throw e
    }

    //having the required role doesn't rescue from authResult failure
    if (authHasFailed(authResult)) return { context, authResult }

    // role validation has nothing to do with auth...
    //this check doesn't belong here, move it out to the auth pipeline
    if (!context.auth)
      return authFailed(context, new UnauthorizedError('Must provide an auth token'))

    const contextRole = roleGetter(context)
    const missingRoleMessage = `You do not have the required ${
      requiredRole.split(':')[0]
    } role`
    if (!contextRole) return authFailed(context, new ForbiddenError(missingRoleMessage))

    const role = roles.find((r) => r.name === requiredRole)
    const myRole = roles.find((r) => r.name === contextRole)

    if (!role)
      return authFailed(
        context,
        new ForbiddenError('Invalid role requirement specified')
      )
    if (!myRole)
      return authFailed(context, new ForbiddenError('Your role is not valid'))
    if (myRole.name === iddqd || myRole.weight >= role.weight)
      return authSuccess(context)
    return authFailed(context, new ForbiddenError(missingRoleMessage))
  }
}

type ValidateRoleBuilderDeps = {
  getRoles: GetRoles
}

export const validateServerRoleBuilderFactory =
  (deps: ValidateRoleBuilderDeps): ValidateServerRoleBuilder =>
  ({ requiredRole }) =>
    validateRole({
      requiredRole,
      rolesLookup: deps.getRoles,
      iddqd: Roles.Server.Admin,
      roleGetter: (context) => context.role || null
    })

export const validateStreamRoleBuilderFactory =
  (deps: ValidateRoleBuilderDeps): ValidateStreamRoleBuilder =>
  ({ requiredRole }: { requiredRole: StreamRoles }) =>
    validateRole({
      requiredRole,
      rolesLookup: deps.getRoles,
      iddqd: Roles.Stream.Owner,
      roleGetter: (context) => context?.stream?.role || null
    })

export const validateResourceAccess: AuthPipelineFunction = async ({
  context,
  authResult,
  params
}) => {
  const { resourceAccessRules } = context

  if (authHasFailed(authResult)) return { context, authResult }
  if (!resourceAccessRules?.length) return authSuccess(context)

  const streamId = context.stream?.id || params?.streamId
  if (!streamId) {
    return authSuccess(context)
  }

  const hasAccess = isResourceAllowed({
    resourceId: streamId,
    resourceType: 'project',
    resourceAccessRules
  })

  if (!hasAccess) {
    return authFailed(
      context,
      new ForbiddenError('You are not authorized to access this resource.'),
      true
    )
  }

  return authSuccess(context)
}

export const validateScope =
  ({ requiredScope }: { requiredScope: string }): AuthPipelineFunction =>
  async ({ context, authResult }) => {
    const errMsg = `Your auth token does not have the required scope${
      requiredScope?.length ? ': ' + requiredScope + '.' : '.'
    }`

    // having the required role doesn't rescue from authResult failure
    if (authHasFailed(authResult)) return { context, authResult }
    if (!context.scopes)
      return authFailed(
        context,
        new ForbiddenError(errMsg, { info: { scope: requiredScope } })
      )
    if (
      context.scopes.indexOf(requiredScope) === -1 &&
      context.scopes.indexOf('*') === -1
    )
      return authFailed(
        context,
        new ForbiddenError(errMsg, { info: { scope: requiredScope } })
      )
    return authSuccess(context)
  }

type StreamGetter = (params: {
  streamId: string
  userId?: string
}) => Promise<MaybeNullOrUndefined<StreamWithOptionalRole>>

type ValidateRequiredStreamDeps = {
  getStream: StreamGetter
}

// this doesn't do any checks  on the scopes, its sole responsibility is to add the
// stream object to the pipeline context
export const validateRequiredStreamFactory =
  (deps: ValidateRequiredStreamDeps): AuthPipelineFunction =>
  // stream getter is an async func over { streamId, userId } returning a stream object
  // IoC baby...
  async ({ context, authResult, params }) => {
    const { getStream } = deps

    if (!params?.streamId)
      return authFailed(
        context,
        new ContextError("The context doesn't have a streamId")
      )
    // because we're assigning to the context, it would raise if it would be null
    // its probably?? safer than returning a new context
    if (!context)
      return authFailed(context, new ContextError('The context is not defined'))

    // cause stream getter could throw, its not a safe function if we want to
    // keep the pipeline rolling
    try {
      const stream = await getStream({
        streamId: params.streamId,
        userId: context?.userId
      })

      if (!stream)
        return authFailed(
          context,
          new NotFoundError(
            'Project ID is malformed and cannot be found, or the project does not exist',
            {
              info: { projectId: params.streamId }
            }
          ),
          true
        )
      context.stream = stream
      return { context, authResult }
    } catch (err) {
      // this prob needs some more detailing to not leak internal errors
      const error = err as Error
      return authFailed(context, new ContextError(error.message))
    }
  }

export const allowForServerAdmins: AuthPipelineFunction = async ({
  context,
  authResult
}) =>
  context.role === Roles.Server.Admin ? authSuccess(context) : { context, authResult }

export const allowForRegisteredUsersOnPublicStreamsEvenWithoutRole: AuthPipelineFunction =
  async ({ context, authResult }) =>
    context.auth && context.stream?.visibility === ProjectRecordVisibility.Public
      ? authSuccess(context)
      : { context, authResult }

export const allowForAllRegisteredUsersOnPublicStreamsWithPublicComments: AuthPipelineFunction =
  async ({ context, authResult }) =>
    context.auth &&
    context.stream?.visibility === ProjectRecordVisibility.Public &&
    context.stream?.allowPublicComments
      ? authSuccess(context)
      : { context, authResult }

export const allowAnonymousUsersOnPublicStreams: AuthPipelineFunction = async ({
  context,
  authResult
}) =>
  context.stream?.visibility === ProjectRecordVisibility.Public
    ? authSuccess(context)
    : { context, authResult }

export const authPipelineCreator = (
  steps: AuthPipelineFunction[]
): AuthPipelineFunction => {
  const pipeline: AuthPipelineFunction = async ({
    context,
    params,
    authResult = { authorized: false }
  }) => {
    for (const step of steps) {
      ;({ context, authResult } = await step({ context, authResult, params }))
      if (authHasFailed(authResult) && authResult?.fatal) break
    }
    // validate auth result a bit...
    if (authResult.authorized && authHasFailed(authResult))
      throw new UnauthorizedError('Auth failure')
    return { context, authResult }
  }
  return pipeline
}

/**
 * TODO: All auth pipeline stuff should be replaced/refactored to just use auth policies, but
 * for now as a quickfix i'm adjusting stream specific pipelines to check auth policies
 */

const validateStreamPolicyAccessFactory =
  (deps: {
    policyInvoker: (params: {
      authData: AuthData
      policies: Authz.AuthPolicies
    }) => Promise<Authz.AuthPolicyResult>
  }): AuthPipelineFunction =>
  async (authData) => {
    const { context, params, authResult } = authData

    if (authHasFailed(authResult)) return { context, authResult }

    if (!params?.streamId)
      return authFailed(
        context,
        new ContextError("The context doesn't have a streamId")
      )

    const authLoaders = await moduleAuthLoaders({ dataLoaders: undefined })
    const policies = Authz.authPoliciesFactory(authLoaders.loaders)
    const result = await deps.policyInvoker({ authData, policies })
    if (result.isOk) {
      return authSuccess(context)
    }

    if (result.error.code === Authz.ProjectNotFoundError.code) {
      return authFailed(
        context,
        new NotFoundError(
          'Project ID is malformed and cannot be found, or the project does not exist',
          {
            info: { projectId: params.streamId }
          }
        ),
        true
      )
    }

    return authFailed(context, new ForbiddenError(result.error.message))
  }

export const streamWritePermissionsPipelineFactory = (deps: {
  getStream: StreamGetter
}): AuthPipelineFunction[] => [
  validateScope({ requiredScope: Scopes.Streams.Write }),
  validateResourceAccess,
  validateRequiredStreamFactory(deps),
  validateStreamPolicyAccessFactory({
    ...deps,
    policyInvoker: async ({ authData, policies }) =>
      policies.project.version.canCreate({
        userId: authData.context.userId,
        projectId: authData.params!.streamId!
      })
  })
]

export const streamCommentsWritePermissionsPipelineFactory = (deps: {
  getStream: StreamGetter
}): AuthPipelineFunction[] => [
  validateScope({ requiredScope: Scopes.Streams.Write }),
  validateResourceAccess,
  validateRequiredStreamFactory(deps),
  validateStreamPolicyAccessFactory({
    ...deps,
    policyInvoker: async ({ authData, policies }) =>
      policies.project.comment.canCreate({
        userId: authData.context.userId,
        projectId: authData.params!.streamId!
      })
  })
]

export const streamReadPermissionsPipelineFactory = (deps: {
  getStream: StreamGetter
}): AuthPipelineFunction[] => [
  validateScope({ requiredScope: Scopes.Streams.Read }),
  validateResourceAccess,
  validateRequiredStreamFactory(deps),
  validateStreamPolicyAccessFactory({
    ...deps,
    policyInvoker: async ({ authData, policies }) =>
      policies.project.canRead({
        userId: authData.context.userId,
        projectId: authData.params!.streamId!
      })
  })
]

export const throwForNotHavingServerRoleFactory =
  (deps: { validateServerRole: ValidateServerRoleBuilder }): ValidateUserServerRole =>
  async (context: AuthContext, requiredRole: ServerRoles) => {
    const { authResult } = await deps.validateServerRole({ requiredRole })({
      context,
      authResult: { authorized: false }
    })
    if (authHasFailed(authResult))
      throw authResult.error ?? new ForbiddenError('Auth failed without an error')
    return true
  }

// Global singleton for easy access
export const throwForNotHavingServerRole = throwForNotHavingServerRoleFactory({
  validateServerRole: validateServerRoleBuilderFactory({
    getRoles: getRolesFactory({ db })
  })
})
