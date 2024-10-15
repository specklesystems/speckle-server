const { db } = require('@/db/knex')
const {
  legacyGetPaginatedUsersCount,
  legacyGetPaginatedUsersFactory
} = require('@/modules/core/repositories/users')
const { resolveTarget } = require('@/modules/serverinvites/helpers/core')
const { clamp } = require('lodash')

/**
 * @typedef {{
 *  id: string,
 *  email: string,
 *  invitedById: string
 * }} ServerInviteGraphqlReturnType
 */

/**
 * @typedef {{
 *  registeredUser: import("@/modules/core/helpers/userHelper").UserRecord | null,
 *  invitedUser: ServerInviteGraphqlReturnType | null,
 *  id: string
 * }} AdminUsersListItem
 */

/**
 * @typedef {{
 *  totalCount: number,
 *  items: Array<AdminUsersListItem>
 * }} AdminUsersListCollection
 */

/**
 * @typedef {{
 *  limit: number,
 *  offset: number,
 *  query: string | null
 * }} PaginationParams
 */

/**
 * @typedef {{
 *  userCount: number,
 *  inviteCount: number,
 *  totalCount: number
 * }} TotalCounts
 */

/**
 * @typedef {{
 *  invitesFilter: {offset: number, limit: number} | null,
 *  usersFilter: {offset: number, limit: number} | null
 * }} UsersInvitesFilters
 */

/**
 * Sanitizing params to ensure limits aren't too high etc.
 * @param {PaginationParams} params
 * @returns {PaginationParams}
 */
function sanitizeParams(params) {
  params.limit = clamp(params.limit || 10, 1, 200)
  params.offset = Math.max(params.offset || 0, 0)
}

/**
 * Get total users & invites that we can find using these params
 * @param {{ countServerInvites: import('@/modules/serverinvites/domain/operations').CountServerInvites}} param0
 */
function getTotalCounts({ countServerInvites }) {
  const countUsers = legacyGetPaginatedUsersCount({ db })

  /**
   * Get total users & invites that we can find using these params
   * @param {PaginationParams} params
   * @returns {Promise<TotalCounts>}
   */
  return async (params) => {
    const { query } = params

    const [userCount, inviteCount] = await Promise.all([
      // Actual users
      countUsers(query),
      // Invites
      countServerInvites(query)
    ])
    const totalCount = userCount + inviteCount

    return { userCount, inviteCount, totalCount }
  }
}

/**
 * Resolve limits & offsets for user & invite queries. All invites will always appear first,
 * and only once there are no more results will users start appearing in the list
 * @param {PaginationParams} params
 * @param {TotalCounts} totalCounts
 * @returns {UsersInvitesFilters}
 */
function resolveLimitsAndOffsets(params, totalCounts) {
  const { offset, limit } = params
  const { inviteCount } = totalCounts

  const inviteOffset = offset < inviteCount ? offset : null
  const inviteLimit =
    inviteOffset !== null ? Math.min(inviteCount - offset, limit) : null

  const userOffset = inviteOffset !== null ? 0 : offset - inviteCount
  const userLimit = limit - (inviteLimit || 0)

  return {
    invitesFilter: inviteLimit ? { limit: inviteLimit, offset: inviteOffset } : null,
    usersFilter: userLimit ? { limit: userLimit, offset: userOffset } : null
  }
}

/**
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} user
 * @returns {AdminUsersListItem}
 */
function mapUserToListItem(user) {
  return {
    invitedUser: null,
    registeredUser: user,
    id: `user:${user.id}`
  }
}

/**
 * @param {import('@/modules/serverinvites/domain/types').ServerInviteRecord} invite
 * @returns {AdminUsersListItem}
 */
function mapInviteToListItem(invite) {
  return {
    registeredUser: null,
    invitedUser: {
      id: invite.id,
      invitedById: invite.inviterId,
      email: resolveTarget(invite.target).userEmail
    },
    id: `invite:${invite.id}`
  }
}

/**
 *
 * @param {{findServerInvites: import('@/modules/serverinvites/domain/operations').FindServerInvites}} param0
 */
function retrieveItems({ findServerInvites }) {
  const getUsers = legacyGetPaginatedUsersFactory({ db })

  /**
   * Retrieve all list items from DB and convert them to the target model
   * @param {PaginationParams} params
   * @param {TotalCounts} counts
   * @returns {Promise<AdminUsersListItem[]>}
   */
  return async (params, counts) => {
    const { invitesFilter, usersFilter } = resolveLimitsAndOffsets(params, counts)
    const { query } = params

    const [invites, users] = await Promise.all([
      // Invites
      invitesFilter
        ? findServerInvites(query, invitesFilter.limit, invitesFilter.offset)
        : [],
      // Users
      usersFilter ? getUsers(usersFilter.limit, usersFilter.offset, query) : []
    ])

    return [
      // Invites first
      ...invites.map((i) => mapInviteToListItem(i)),
      // Users after
      ...users.map((u) => mapUserToListItem(u))
    ]
  }
}

/**
 *
 * @param {{ getTotalCounts: (params: PaginationParams) => Promise<number>, findServerInvites: import('@/modules/serverinvites/domain/operations').FindServerInvites}} param0
 */
function getAdminUsersListCollection({ getTotalCounts, findServerInvites }) {
  /**
   * Resolve admin users list data using the specified filter params
   * @param {PaginationParams} params
   * @returns {Promise<AdminUsersListCollection>}
   */
  return async (params) => {
    sanitizeParams(params)

    const totalCounts = await getTotalCounts(params)
    const items = await retrieveItems({ findServerInvites })(params, totalCounts)

    return {
      items,
      totalCount: totalCounts.totalCount
    }
  }
}

module.exports = {
  getAdminUsersListCollection,
  getTotalCounts
}
