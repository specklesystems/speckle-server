const { Roles } = require('@/modules/core/helpers/mainConstants')
const { getRoles } = require('@/modules/shared')
const { ForbiddenError } = require('apollo-server-express')
const { SpeckleForbiddenError: SFE } = require('./errors')

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

const authFailed = (error) => ({ authorized: false, error })
const authSuccess = () => ({ authorized: true, error: null })

const validateRole =
  ({ requiredRole, roles, iddqd }) =>
  async ({ context, authResult }) => {
    // having the required role doesn't rescue from authResult failure
    if (authResult.error) return authResult
    if (!context.auth) return authFailed(new SFE('You must provide an auth token.'))

    const role = roles.find((r) => r.name === requiredRole)
    const myRole = roles.find((r) => r.name === context.role)

    if (!role) return authFailed(new SFE('Invalid server role requirement specified'))
    if (!myRole) return authFailed(new SFE('Your role is not valid'))
    if (myRole.name === iddqd || myRole.weight >= role.weight) return authSuccess()

    return authFailed()
  }

// eslint-disable-next-line no-unused-vars
const validateServerRole = async ({ requiredRole }) =>
  validateRole({ requiredRole, roles: await getRoles(), iddqd: Roles.Server.Admin })

const authPipelineCreator = (steps) => {
  const pipeline = async ({ context, params }) => {
    let authResult = { authorized: false, error: null }
    steps.forEach(async (step) => {
      authResult = await step({ context, authResult, params })
    })
    // validate auth result a bit...
    if (!authResult.authorized && authResult.error)
      throw new Error('a big fuckup on our end')
    return authResult
  }
  return pipeline
}

//we could even add an auth middleware creator
// todo move this to a webserver related module, it has no place here
// eslint-disable-next-line no-unused-vars
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

module.exports = {
  authPipelineCreator,
  authSuccess,
  authFailed,
  validateRole
}
