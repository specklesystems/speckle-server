const { Roles, Scopes } = require('@/modules/core/helpers/mainConstants')
const { getStream } = require('@/modules/core/services/streams')
const { getRoles } = require('@/modules/shared')
const { ForbiddenError } = require('apollo-server-express')
const { SpeckleForbiddenError: SFE } = require('./errors')

class SpeckleContextError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SpeckleContextError'
  }
}

// const authorizeStreamAccess = async ({
//   streamId,
//   userId,
//   serverRole,
//   auth,
//   requireRole = false
// }) => {
//   if (serverRole === Roles.Server.ArchivedUser)
//     throw new ForbiddenError('You are not authorized.')
//   const stream = await getStream({ streamId, userId })
//   if (!stream) throw new ApolloError('Stream not found')

//   let authZed = true

//   if (!stream.isPublic && auth === false) authZed = false

//   if (!stream.isPublic && !stream.role) authZed = false

//   if (stream.isPublic && requireRole && !stream.allowPublicComments && !stream.role)
//     authZed = false

//   if (!authZed) throw new ForbiddenError('You are not authorized.')
//   return stream
// }

// async function oldvalidateServerRole(context, requiredRole) {
//   if (!roles) roles = await knex('user_roles').select('*')

//   if (!context.auth) throw new ForbiddenError('You must provide an auth token.')

//   const role = roles.find((r) => r.name === requiredRole)
//   const myRole = roles.find((r) => r.name === context.role)

//   if (!role) throw new ApolloError('Invalid server role specified')
//   if (!myRole)
//     throw new ForbiddenError('You do not have the required server role (null)')

//   if (context.role === 'server:admin') return true
//   if (myRole.weight >= role.weight) return true

//   throw new ForbiddenError('You do not have the required server role')
// }

const authFailed = (context, error = null) => ({
  context,
  authResult: { authorized: false, error }
})
const authSuccess = (context) => ({
  context,
  authResult: { authorized: true, error: null }
})

const validateRole =
  ({ requiredRole, roles, iddqd, roleGetter }) =>
  async ({ context, authResult }) => {
    // having the required role doesn't rescue from authResult failure
    if (authResult.error)
      return authFailed(
        context,
        new SFE("Role validation doesn't rescue the auth pipeline")
      )

    // role validation has nothing to do with auth...
    //this check doesn't belong here, move it out to the auth pipeline
    if (!context.auth)
      return authFailed(context, new SFE('Cannot validate role without auth'))

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
    roles: getRoles(),
    iddqd: Roles.Server.Admin,
    roleGetter: (context) => context.role
  })

const validateStreamRole = ({ requiredRole }) =>
  validateRole({
    requiredRole,
    roles: getRoles(),
    iddqd: Roles.Stream.Owner,
    roleGetter: (context) => context.stream.role
  })

// this could be still useful, if the operation doesnt require a stream context
// const authorizeResolver = refactor the implementation in ../index.js

const validateScope =
  ({ requiredScope }) =>
  async ({ context, authResult }) => {
    // having the required role doesn't rescue from authResult failure
    if (authResult.error)
      return authFailed(
        context,
        new SFE("Scope validation doesn't rescue the auth pipeline")
      )
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
  async ({ context, params }) => {
    if (!params?.streamId)
      return authFailed(
        context,
        new SpeckleContextError("The context doesn't have a streamId")
      )
    // because we're assigning to the context, it would raise if it would be null
    // its probably?? safer than returning a new context
    if (!context)
      return authFailed(context, new SpeckleContextError('The context is not defined'))

    // cause stream getter could throw, its not a safe function if we want to
    // keep the pipeline rolling
    try {
      const stream = await streamGetter({
        streamId: params.streamId,
        userId: context?.userId
      })
      context.stream = stream
      return authSuccess(context)
    } catch (err) {
      // this prob needs some more detailing to not leak internal errors
      return authFailed(context, new SpeckleContextError(err.message))
    }
  }

const allowForRegisteredUsersOnPublicStreamsEvenWithoutRole = async ({
  context,
  authResult
}) =>
  context.auth && context.stream.isPublic
    ? authSuccess(context)
    : { context, authResult }

const authPipelineCreator = (steps) => {
  const pipeline = async ({ context, params }) => {
    let authResult = { authorized: false, error: null }
    steps.forEach(async (step) => {
      ;({ context, authResult } = await step({ context, authResult, params }))
    })
    // validate auth result a bit...
    if (authResult.authorized && authResult.error)
      throw new Error('a big fuckup on our end')
    return { context, authResult }
  }
  return pipeline
}

//we could even add an auth middleware creator
// todo move this to a webserver related module, it has no place here
const authMiddlewareCreator = (steps) => {
  const pipeline = authPipelineCreator(steps)

  const middleware = async (req, _, next) => {
    const authResult = await pipeline({ context: req.context, params: req.params })
    if (!authResult.authorized) {
      let message = 'Unknown AuthZ error'
      if (authResult.error) message = authResult.error.message
      throw new ForbiddenError(message)
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
  contextRequiresStream,
  SpeckleContextError,
  authMiddlewareCreator
}
