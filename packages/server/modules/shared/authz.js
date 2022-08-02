const { Roles, Scopes } = require('@/modules/core/helpers/mainConstants')
const { getStream } = require('@/modules/core/services/streams')
const { getRoles } = require('@/modules/shared')
const {
  ForbiddenError: SFE,
  UnauthorizedError: SUE,
  ContextError,
  BadRequestError
} = require('@/modules/shared/errors')

const authFailed = (context, error = null, fatal = false) => ({
  context,
  authResult: { authorized: false, error, fatal }
})
const authSuccess = (context) => ({
  context,
  authResult: { authorized: true, error: null }
})

const validateRole =
  ({ requiredRole, rolesLookup, iddqd, roleGetter }) =>
  async ({ context, authResult }) => {
    const roles = await rolesLookup()
    // having the required role doesn't rescue from authResult failure
    if (authResult.error) return { context, authResult }

    // role validation has nothing to do with auth...
    //this check doesn't belong here, move it out to the auth pipeline
    if (!context.auth)
      return authFailed(context, new SUE('Cannot validate role without auth'))

    const role = roles.find((r) => r.name === requiredRole)
    const myRole = roles.find((r) => r.name === roleGetter(context))

    if (!role) return authFailed(context, new SFE('Invalid role requirement specified'))
    if (!myRole) return authFailed(context, new SFE('Your role is not valid'))
    if (myRole.name === iddqd || myRole.weight >= role.weight)
      return authSuccess(context)

    return authFailed(context, new SFE('You do not have the required role'))
  }

const validateServerRole = ({ requiredRole }) =>
  validateRole({
    requiredRole,
    rolesLookup: getRoles,
    iddqd: Roles.Server.Admin,
    roleGetter: (context) => context.role
  })

const validateStreamRole = ({ requiredRole }) =>
  validateRole({
    requiredRole,
    rolesLookup: getRoles,
    iddqd: Roles.Stream.Owner,
    roleGetter: (context) => context.stream?.role
  })

// this could be still useful, if the operation doesnt require a stream context
// const authorizeResolver = refactor the implementation in ../index.js

const validateScope =
  ({ requiredScope }) =>
  async ({ context, authResult }) => {
    // having the required role doesn't rescue from authResult failure
    if (authResult.error) return { context, authResult }
    if (!context.scopes)
      return authFailed(context, new SFE('You do not have the required privileges.'))
    if (
      context.scopes.indexOf(requiredScope) === -1 &&
      context.scopes.indexOf('*') === -1
    )
      return authFailed(context, new SFE('You do not have the required privileges.'))
    return authSuccess(context)
  }

// this doesn't do any checks  on the scopes, its sole responsibility is to add the
// stream object to the pipeline context
const contextRequiresStream =
  (streamGetter) =>
  // stream getter is an async func over { streamId, userId } returning a stream object
  // IoC baby...
  async ({ context, authResult, params }) => {
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
      const stream = await streamGetter({
        streamId: params.streamId,
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
      return authFailed(context, new ContextError(err.message))
    }
  }

const allowForRegisteredUsersOnPublicStreamsEvenWithoutRole = async ({
  context,
  authResult
}) =>
  context.auth && context.stream?.isPublic
    ? authSuccess(context)
    : { context, authResult }

const allowForAllRegisteredUsersOnPublicStreamsWithPublicComments = async ({
  context,
  authResult
}) =>
  context.auth && context.stream?.isPublic && context.stream?.allowPublicComments
    ? authSuccess(context)
    : { context, authResult }

const allowAnonymousUsersOnPublicStreams = async ({ context, authResult }) => {
  return context.stream?.isPublic ? authSuccess(context) : { context, authResult }
}

const authPipelineCreator = (steps) => {
  const pipeline = async ({ context, params }) => {
    let authResult = { authorized: false, error: null }
    for (const step of steps) {
      ;({ context, authResult } = await step({ context, authResult, params }))
      if (authResult.fatal) break
    }
    // validate auth result a bit...
    if (authResult.authorized && authResult.error) throw new Error('Auth failure')
    return { context, authResult }
  }
  return pipeline
}

//we could even add an auth middleware creator
// todo move this to a webserver related module, it has no place here
const authMiddlewareCreator = (steps) => {
  const pipeline = authPipelineCreator(steps)

  const middleware = async (req, res, next) => {
    const { authResult } = await pipeline({ context: req.context, params: req.params })
    if (!authResult.authorized) {
      let message = 'Unknown AuthZ error'
      let status = 500
      if (authResult.error) {
        message = authResult.error.message
        if (authResult.error instanceof SUE) status = 401
        if (authResult.error instanceof SFE) status = 403
      }

      return res.status(status).json({ error: message })
    }
    next()
  }
  return middleware
}

// eslint-disable-next-line no-unused-vars
const exampleMiddleware = authMiddlewareCreator([
  // at some point add the context preparation here too
  validateServerRole({ requiredRole: Roles.Server.User }),
  validateScope({ requiredScope: Scopes.Streams.Write }),
  contextRequiresStream(getStream),
  validateStreamRole({ requiredRole: Roles.Stream.Reviewer }),
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole
])

module.exports = {
  authPipelineCreator,
  authSuccess,
  authFailed,
  validateRole,
  validateScope,
  validateServerRole,
  validateStreamRole,
  contextRequiresStream,
  ContextError,
  authMiddlewareCreator,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowAnonymousUsersOnPublicStreams,
  streamWritePermissions: [
    validateServerRole({ requiredRole: Roles.Server.User }),
    validateScope({ requiredScope: Scopes.Streams.Write }),
    contextRequiresStream(getStream),
    validateStreamRole({ requiredRole: Roles.Stream.Contributor })
  ],
  streamReadPermissions: [
    validateServerRole({ requiredRole: Roles.Server.User }),
    validateScope({ requiredScope: Scopes.Streams.Read }),
    contextRequiresStream(getStream),
    validateStreamRole({ requiredRole: Roles.Stream.Contributor })
  ]
}
