'use strict'
const knex = require(`@/db/knex`)
const { ForbiddenError, ApolloError } = require('apollo-server-express')
const {
  pubsub,
  StreamSubscriptions,
  CommitSubscriptions,
  BranchSubscriptions
} = require('@/modules/shared/utils/subscriptions')
const { Roles } = require('@speckle/shared')
const { adminOverrideEnabled } = require('@/modules/shared/helpers/envHelper')

const { ServerAcl: ServerAclSchema } = require('@/modules/core/dbSchema')
const { getRoles } = require('@/modules/shared/roles')
const ServerAcl = () => ServerAclSchema.knex()

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

  const roles = await getRoles()

  // TODO: Cache these results with a TTL of 1 mins or so, it's pointless to query the db every time we get a ping.

  const role = roles.find((r) => r.name === requiredRole)

  if (!role) throw new ApolloError('Unknown role: ' + requiredRole)

  if (adminOverrideEnabled()) {
    const serverRoles = await ServerAcl().select('role').where({ userId })
    if (serverRoles.map((r) => r.role).includes(Roles.Server.Admin)) return requiredRole
  }

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
  throw new ForbiddenError('You are not authorized.')
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

const UserRoles = () => knex('user_roles')
async function registerOrUpdateRole(role) {
  await knex.raw(
    `${UserRoles()
      .insert(role)
      .toString()} on conflict (name) do update set weight = ?, description = ?, "resourceTarget" = ? `,
    [role.weight, role.description, role.resourceTarget]
  )
  return
}

module.exports = {
  registerOrUpdateScope,
  registerOrUpdateRole,
  // validateServerRole,
  validateScopes,
  authorizeResolver,
  pubsub,
  getRoles,
  StreamPubsubEvents: StreamSubscriptions,
  CommitPubsubEvents: CommitSubscriptions,
  BranchPubsubEvents: BranchSubscriptions
}
