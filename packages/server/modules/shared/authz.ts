import {
  Scopes,
  Roles,
  ServerRoles,
  StreamRoles
} from '@/modules/core/helpers/mainConstants'
import { getRoles } from '@/modules/shared/roles'
import { getStream } from '@/modules/core/services/streams'

import {
  BaseError,
  ForbiddenError,
  UnauthorizedError,
  ContextError,
  BadRequestError
} from '@/modules/shared/errors'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { isResourceAllowed } from '@/modules/core/helpers/token'
import { getAutomationProject } from '@/modules/automate/repositories/automations'

interface AuthResult {
  authorized: boolean
}

interface AuthFailedResult extends AuthResult {
  authorized: false
  error: BaseError | null
  fatal?: boolean
}

interface Stream {
  id: string
  role?: StreamRoles
  isPublic: boolean
  allowPublicComments: boolean
}

export interface AuthContext {
  auth: boolean
  userId?: string
  role?: ServerRoles
  token?: string
  scopes?: string[]
  stream?: Stream
  err?: Error | BaseError
  /**
   * Set if authenticated with an app token
   */
  appId?: string | null
  /**
   * Set, if the token has resource access limits (e.g. only access to specific projects)
   */
  resourceAccessRules?: Nullable<TokenResourceIdentifier[]>
}

export interface AuthParams {
  streamId?: string
  automationId?: string
}

interface AuthData {
  context: AuthContext
  authResult: AuthResult
  params?: AuthParams
}

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

type AvailableRoles = ServerRoles | StreamRoles

interface RoleData<T extends AvailableRoles> {
  weight: number
  name: T
}

export type AuthPipelineFunction = ({
  context,
  authResult,
  params
}: AuthData) => Promise<AuthData>

export const authHasFailed = (authResult: AuthResult): authResult is AuthFailedResult =>
  'error' in authResult

interface RoleValidationInput<T extends AvailableRoles> {
  requiredRole: T
  rolesLookup: () => Promise<RoleData<T>[]>
  iddqd: T
  roleGetter: (context: AuthContext) => T | null
}

// interface StreamRoleValidationInput {
// requiredRole: StreamRoles
// rolesLookup: () => Promise<StreamRoleData[]>
// iddqd: StreamRoles
// roleGetter: (AuthContext) => StreamRoles
// }

export function validateRole<T extends AvailableRoles>({
  requiredRole,
  rolesLookup,
  iddqd,
  roleGetter
}: RoleValidationInput<T>): AuthPipelineFunction {
  return async ({ context, authResult }): Promise<AuthData> => {
    const roles = await rolesLookup()
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

export const validateServerRole = ({ requiredRole }: { requiredRole: ServerRoles }) =>
  validateRole({
    requiredRole,
    rolesLookup: getRoles,
    iddqd: Roles.Server.Admin,
    roleGetter: (context) => context.role || null
  })

export const validateStreamRole = ({ requiredRole }: { requiredRole: StreamRoles }) =>
  validateRole({
    requiredRole,
    rolesLookup: getRoles,
    iddqd: Roles.Stream.Owner,
    roleGetter: (context) => context?.stream?.role || null
  })

export const validateResourceAccess: AuthPipelineFunction = async ({
  context,
  authResult
}) => {
  const { resourceAccessRules } = context

  if (authHasFailed(authResult)) return { context, authResult }
  if (!resourceAccessRules?.length) return authSuccess(context)

  const streamId = context.stream?.id
  if (!streamId) {
    return authSuccess(context)
  }

  const hasAccess = isResourceAllowed({
    resourceId: streamId,
    resourceType: TokenResourceIdentifierType.Project,
    resourceAccessRules
  })

  if (!hasAccess) {
    return authFailed(
      context,
      new ForbiddenError('You do not have the required privileges.'),
      true
    )
  }

  return authSuccess(context)
}

export const validateScope =
  ({ requiredScope }: { requiredScope: string }): AuthPipelineFunction =>
  async ({ context, authResult }) => {
    // having the required role doesn't rescue from authResult failure
    if (authHasFailed(authResult)) return { context, authResult }
    if (!context.scopes)
      return authFailed(
        context,
        new ForbiddenError('You do not have the required privileges.')
      )
    if (
      context.scopes.indexOf(requiredScope) === -1 &&
      context.scopes.indexOf('*') === -1
    )
      return authFailed(
        context,
        new ForbiddenError('You do not have the required privileges.')
      )
    return authSuccess(context)
  }

type StreamGetter = (params: {
  streamId: string
  userId?: string
}) => Promise<MaybeNullOrUndefined<Stream>>

// this doesn't do any checks  on the scopes, its sole responsibility is to add the
// stream object to the pipeline context
export const contextRequiresStream =
  (deps: {
    getStream: StreamGetter
    getAutomationProject: typeof getAutomationProject
  }): AuthPipelineFunction =>
  // stream getter is an async func over { streamId, userId } returning a stream object
  // IoC baby...
  async ({ context, authResult, params }) => {
    const { getStream, getAutomationProject } = deps

    if (!params?.streamId && !params?.automationId)
      return authFailed(
        context,
        new ContextError("The context doesn't have a streamId or automationId")
      )
    // because we're assigning to the context, it would raise if it would be null
    // its probably?? safer than returning a new context
    if (!context)
      return authFailed(context, new ContextError('The context is not defined'))

    // cause stream getter could throw, its not a safe function if we want to
    // keep the pipeline rolling
    try {
      const stream = params.streamId
        ? await getStream({
            streamId: params.streamId,
            userId: context?.userId
          })
        : await getAutomationProject({
            automationId: params.automationId!,
            userId: context?.userId
          })

      if (!stream)
        return authFailed(
          context,
          new BadRequestError('Stream inputs are malformed'),
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
    context.auth && context.stream?.isPublic
      ? authSuccess(context)
      : { context, authResult }

export const allowForAllRegisteredUsersOnPublicStreamsWithPublicComments: AuthPipelineFunction =
  async ({ context, authResult }) =>
    context.auth && context.stream?.isPublic && context.stream?.allowPublicComments
      ? authSuccess(context)
      : { context, authResult }

export const allowAnonymousUsersOnPublicStreams: AuthPipelineFunction = async ({
  context,
  authResult
}) => (context.stream?.isPublic ? authSuccess(context) : { context, authResult })

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
      throw new Error('Auth failure')
    return { context, authResult }
  }
  return pipeline
}

export const streamWritePermissions: AuthPipelineFunction[] = [
  validateServerRole({ requiredRole: Roles.Server.Guest }),
  validateScope({ requiredScope: Scopes.Streams.Write }),
  contextRequiresStream({ getStream, getAutomationProject }),
  validateStreamRole({ requiredRole: Roles.Stream.Contributor }),
  validateResourceAccess
]
export const streamReadPermissions: AuthPipelineFunction[] = [
  validateServerRole({ requiredRole: Roles.Server.Guest }),
  validateScope({ requiredScope: Scopes.Streams.Read }),
  contextRequiresStream({ getStream, getAutomationProject }),
  validateStreamRole({ requiredRole: Roles.Stream.Contributor }),
  validateResourceAccess
]

if (adminOverrideEnabled()) streamReadPermissions.push(allowForServerAdmins)

export const throwForNotHavingServerRole = async (
  context: AuthContext,
  requiredRole: ServerRoles
) => {
  const { authResult } = await validateServerRole({ requiredRole })({
    context,
    authResult: { authorized: false }
  })
  if (authHasFailed(authResult))
    throw authResult.error ?? new Error('Auth failed without an error')
  return true
}
