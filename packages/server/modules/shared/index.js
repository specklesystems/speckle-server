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
const { getRolesFactory } = require('@/modules/shared/repositories/roles')
const {
  roleResourceTypeToTokenResourceType,
  isResourceAllowed
} = require('@/modules/core/helpers/token')
const db = require('@/db/knex')
const ServerAcl = () => ServerAclSchema.knex()

/**
 * Validates the scope against a list of scopes of the current session.
 * @param  {string[]|undefined} scopes
 * @param  {string} scope
 * @return {void}
 */
async function validateScopes(scopes, scope) {
  const errMsg = `Your auth token does not have the required scope${
    scope?.length ? ': ' + scope + '.' : '.'
  }`

  if (!scopes) throw new ForbiddenError(errMsg, { scope })
  if (scopes.indexOf(scope) === -1 && scopes.indexOf('*') === -1)
    throw new ForbiddenError(errMsg, { scope })
}

/**
 * Checks the userId against the resource's acl.
 * @param  {string | null | undefined} userId
 * @param  {string} resourceId
 * @param  {string} requiredRole
 * @param {import('@/modules/serverinvites/services/operations').TokenResourceIdentifier[] | undefined | null} [userResourceAccessLimits]
 */
async function authorizeResolver(
  userId,
  resourceId,
  requiredRole,
  userResourceAccessLimits
) {
  userId = userId || null
  const roles = await getRolesFactory({ db })()

  // TODO: Cache these results with a TTL of 1 mins or so, it's pointless to query the db every time we get a ping.

  const role = roles.find((r) => r.name === requiredRole)
  if (!role) throw new ApolloError('Unknown role: ' + requiredRole)

  const resourceRuleType = roleResourceTypeToTokenResourceType(role.resourceTarget)
  const isResourceLimited =
    resourceRuleType &&
    !isResourceAllowed({
      resourceId,
      resourceType: resourceRuleType,
      resourceAccessRules: userResourceAccessLimits
    })
  if (isResourceLimited) {
    throw new ForbiddenError('You are not authorized to access this resource.')
  }

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
  } catch {
    throw new ApolloError(
      `Resource of type ${role.resourceTarget} with ${resourceId} not found`
    )
  }

  const userAclEntry = userId
    ? await knex(role.aclTableName).select('*').where({ resourceId, userId }).first()
    : null

  if (!userAclEntry) {
    throw new ForbiddenError('You are not authorized to access this resource.')
  }

  userAclEntry.role = roles.find((r) => r.name === userAclEntry.role)

  if (userAclEntry.role.weight >= role.weight) return userAclEntry.role.name
  throw new ForbiddenError('You are not authorized.')
}

module.exports = {
  validateScopes,
  authorizeResolver,
  pubsub,
  StreamPubsubEvents: StreamSubscriptions,
  CommitPubsubEvents: CommitSubscriptions,
  BranchPubsubEvents: BranchSubscriptions
}
