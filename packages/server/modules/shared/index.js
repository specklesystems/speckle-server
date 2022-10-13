'use strict'
const Redis = require('ioredis')
const knex = require(`@/db/knex`)
const { ForbiddenError, ApolloError } = require('apollo-server-express')
const { RedisPubSub } = require('graphql-redis-subscriptions')
const { buildRequestLoaders } = require('@/modules/core/loaders')
const { validateToken } = require(`@/modules/core/services/tokens`)

const StreamPubsubEvents = Object.freeze({
  UserStreamAdded: 'USER_STREAM_ADDED',
  UserStreamRemoved: 'USER_STREAM_REMOVED',
  StreamUpdated: 'STREAM_UPDATED',
  StreamDeleted: 'STREAM_DELETED'
})

const CommitPubsubEvents = Object.freeze({
  CommitCreated: 'COMMIT_CREATED',
  CommitUpdated: 'COMMIT_UPDATED',
  CommitDeleted: 'COMMIT_DELETED'
})

/**
 * GraphQL Subscription PubSub instance
 */
const pubsub = new RedisPubSub({
  publisher: new Redis(process.env.REDIS_URL),
  subscriber: new Redis(process.env.REDIS_URL)
})

/**
 * @typedef {import('@/modules/shared/helpers/typeHelper').GraphQLContext} GraphQLContext
 */

/**
 * Add data loaders to auth ctx
 * @param {import('@/modules/shared/authz').AuthContext} ctx
 * @returns {GraphQLContext}
 */
function addLoadersToCtx(ctx) {
  const loaders = buildRequestLoaders(ctx)
  ctx.loaders = loaders
  return ctx
}

/**
 * Build context for GQL operations
 * @returns {Promise<GraphQLContext>}
 */
async function buildContext({ req, connection }) {
  // Parsing auth info
  const ctx = await contextApiTokenHelper({ req, connection })

  // Adding request data loaders
  return addLoadersToCtx(ctx)
}

/**
 * Not just Graphql server context helper: sets req.context to have an auth prop (true/false), userId and server role.
 * @returns {Promise<import('@/modules/shared/authz').AuthContext>}
 */
async function contextApiTokenHelper({ req, connection }) {
  let token = null

  if (connection && connection.context.token) {
    // Websockets (subscriptions)
    token = connection.context.token
  } else if (req && req.headers.authorization) {
    // Standard http post
    token = req.headers.authorization
  }
  if (token && token.includes('Bearer ')) {
    token = token.split(' ')[1]
  }

  if (token === null) return { auth: false }

  try {
    const { valid, scopes, userId, role } = await validateToken(token)

    if (!valid) {
      return { auth: false }
    }

    return { auth: true, userId, role, token, scopes }
  } catch (e) {
    // TODO: Think whether perhaps it's better to throw the error
    return { auth: false, err: e }
  }
}

/**
 * Express middleware wrapper around the buildContext function. sets req.context to have an auth prop (true/false), userId and server role.
 */
async function contextMiddleware(req, res, next) {
  const result = await buildContext({ req, res })
  req.context = result
  next()
}

let roles

const getRoles = async () => {
  if (roles) return roles
  roles = await knex('user_roles').select('*')
  return roles
}

/**
 * Validates a server role against the req's context object.
 * @param  {import('@/modules/shared/helpers/typeHelper').GraphQLContext} context
 * @param  {string} requiredRole
 */
async function validateServerRole(context, requiredRole) {
  const roles = await getRoles()

  if (!context.auth) throw new ForbiddenError('You must provide an auth token.')

  const role = roles.find((r) => r.name === requiredRole)
  const myRole = roles.find((r) => r.name === context.role)

  if (!role) throw new ApolloError('Invalid server role specified')
  if (!myRole)
    throw new ForbiddenError('You do not have the required server role (null)')

  if (context.role === 'server:admin') return true
  if (myRole.weight >= role.weight) return true

  throw new ForbiddenError('You do not have the required server role')
}

/**
 * Validates the scope against a list of scopes of the current session.
 * @param  {[type]} scopes [description]
 * @param  {[type]} scope  [description]
 * @return {[type]}        [description]
 */
async function validateScopes(scopes, scope) {
  if (!scopes) throw new ForbiddenError('You do not have the required privileges.')
  if (scopes.indexOf(scope) === -1 && scopes.indexOf('*') === -1)
    throw new ForbiddenError('You do not have the required privileges.')
}

/**
 * Checks the userId against the resource's acl.
 * @param  {string} userId
 * @param  {string} resourceId
 * @param  {string} requiredRole
 */
async function authorizeResolver(userId, resourceId, requiredRole) {
  userId = userId || null

  if (!roles) roles = await knex('user_roles').select('*')

  // TODO: Cache these results with a TTL of 1 mins or so, it's pointless to query the db every time we get a ping.

  const role = roles.find((r) => r.name === requiredRole)

  if (!role) throw new ApolloError('Unknown role: ' + requiredRole)

  try {
    const { isPublic } = await knex(role.resourceTarget)
      .select('isPublic')
      .where({ id: resourceId })
      .first()
    if (isPublic && role.weight < 200) return true
  } catch (e) {
    throw new ApolloError(
      `Resource of type ${role.resourceTarget} with ${resourceId} not found`
    )
  }

  const userAclEntry = userId
    ? await knex(role.aclTableName).select('*').where({ resourceId, userId }).first()
    : null

  if (!userAclEntry)
    throw new ForbiddenError('You do not have access to this resource.')

  userAclEntry.role = roles.find((r) => r.name === userAclEntry.role)

  if (userAclEntry.role.weight >= role.weight) return userAclEntry.role.name
  else throw new ForbiddenError('You are not authorized.')
}

const Scopes = () => knex('scopes')

async function registerOrUpdateScope(scope) {
  await knex.raw(
    `${Scopes()
      .insert(scope)
      .toString()} on conflict (name) do update set public = ?, description = ? `,
    [scope.public, scope.description]
  )
  return
}

const Roles = () => knex('user_roles')
async function registerOrUpdateRole(role) {
  await knex.raw(
    `${Roles()
      .insert(role)
      .toString()} on conflict (name) do update set weight = ?, description = ?, "resourceTarget" = ? `,
    [role.weight, role.description, role.resourceTarget]
  )
  return
}

module.exports = {
  registerOrUpdateScope,
  registerOrUpdateRole,
  buildContext,
  addLoadersToCtx,
  contextMiddleware,
  validateServerRole,
  validateScopes,
  authorizeResolver,
  pubsub,
  getRoles,
  StreamPubsubEvents,
  CommitPubsubEvents
}
