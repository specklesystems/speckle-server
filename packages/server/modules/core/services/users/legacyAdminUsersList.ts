import {
  LegacyAdminUsersListItem,
  LegacyAdminUsersPaginationParams,
  LegacyGetAdminUsersListCollection,
  LegacyGetPaginatedUsers,
  LegacyGetPaginatedUsersCount
} from '@/modules/core/domain/users/operations'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import {
  CountServerInvites,
  FindServerInvites
} from '@/modules/serverinvites/domain/operations'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import { resolveTarget } from '@/modules/serverinvites/helpers/core'
import { clamp } from 'lodash'

type LegacyGetUsersInvitesTotalCounts = {
  userCount: number
  inviteCount: number
  totalCount: number
}

type GetTotalCountsDeps = {
  countUsers: LegacyGetPaginatedUsersCount
  countServerInvites: CountServerInvites
}

/**
 * Get total users & invites that we can find using these params
 */
const getTotalCountsFactory =
  (deps: GetTotalCountsDeps) =>
  async (
    params: LegacyAdminUsersPaginationParams
  ): Promise<LegacyGetUsersInvitesTotalCounts> => {
    const { query } = params

    const [userCount, inviteCount] = await Promise.all([
      // Actual users
      deps.countUsers(query),
      // Invites
      deps.countServerInvites(query)
    ])
    const totalCount = userCount + inviteCount

    return { userCount, inviteCount, totalCount }
  }

/**
 * Sanitizing params to ensure limits aren't too high etc.
 */
function sanitizeParams(params: LegacyAdminUsersPaginationParams) {
  params.limit = clamp(params.limit || 10, 1, 200)
  params.offset = Math.max(params.offset || 0, 0)
}

/**
 * Resolve limits & offsets for user & invite queries. All invites will always appear first,
 * and only once there are no more results will users start appearing in the list
 */
function resolveLimitsAndOffsets(
  params: LegacyAdminUsersPaginationParams,
  totalCounts: LegacyGetUsersInvitesTotalCounts
) {
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

function mapUserToListItem(user: UserRecord): LegacyAdminUsersListItem {
  return {
    invitedUser: null,
    registeredUser: user,
    id: `user:${user.id}`
  }
}

function mapInviteToListItem(invite: ServerInviteRecord): LegacyAdminUsersListItem {
  return {
    registeredUser: null,
    invitedUser: {
      id: invite.id,
      invitedById: invite.inviterId,
      email: resolveTarget(invite.target).userEmail!
    },
    id: `invite:${invite.id}`
  }
}

type RetrieveItemsDeps = {
  findServerInvites: FindServerInvites
  getUsers: LegacyGetPaginatedUsers
}

const retrieveItemsFactory =
  (deps: RetrieveItemsDeps) =>
  async (
    params: LegacyAdminUsersPaginationParams,
    counts: LegacyGetUsersInvitesTotalCounts
  ) => {
    const { invitesFilter, usersFilter } = resolveLimitsAndOffsets(params, counts)
    const { query } = params

    const [invites, users] = await Promise.all([
      // Invites
      invitesFilter
        ? deps.findServerInvites(query, invitesFilter.limit, invitesFilter.offset || 0)
        : [],
      // Users
      usersFilter ? deps.getUsers(usersFilter.limit, usersFilter.offset, query) : []
    ])

    return [
      // Invites first
      ...invites.map((i) => mapInviteToListItem(i)),
      // Users after
      ...users.map((u) => mapUserToListItem(u))
    ]
  }

/**
 * Resolve admin users list data using the specified filter params
 * @deprecated Use individual getTotalStreamCount/adminProjectList, getTotalUserCount/adminUserList, getTotalInviteCount/adminInviteList operations
 */
export const getAdminUsersListCollectionFactory =
  (deps: GetTotalCountsDeps & RetrieveItemsDeps): LegacyGetAdminUsersListCollection =>
  async (params) => {
    sanitizeParams(params)

    const totalCounts = await getTotalCountsFactory(deps)(params)
    const items = await retrieveItemsFactory(deps)(params, totalCounts)

    return {
      items,
      totalCount: totalCounts.totalCount
    }
  }
