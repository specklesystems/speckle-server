'use strict'
const knex = require(`@/db/knex`)
const { ForbiddenError, ApolloError } = require('apollo-server-express')
const {
  pubsub,
  StreamSubscriptions,
  CommitSubscriptions,
  BranchSubscriptions
} = require('@/modules/shared/utils/subscriptions')

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
 * @param  {string[]|undefined} scopes
 * @param  {string} scope
 * @return {void}
 */
async function validateScopes(scopes, scope) {
  if (!scopes) throw new ForbiddenError('You do not have the required privileges.')
  if (scopes.indexOf(scope) === -1 && scopes.indexOf('*') === -1)
    throw new ForbiddenError('You do not have the required privileges.')
}

/**
 * Checks the userId against the resource's acl.
 * @param  {string | null | undefined} userId
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
  validateServerRole,
  validateScopes,
  authorizeResolver,
  pubsub,
  getRoles,
  StreamPubsubEvents: StreamSubscriptions,
  CommitPubsubEvents: CommitSubscriptions,
  BranchPubsubEvents: BranchSubscriptions
}
