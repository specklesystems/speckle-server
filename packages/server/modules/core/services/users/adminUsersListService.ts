import { countUsers, getUsers } from '@/modules/core/services/users'
import { resolveTarget } from '@/modules/serverinvites/helpers/inviteHelper'
import {
  countServerInvites,
  findServerInvites
} from '@/modules/serverinvites/repositories'
import { clamp } from 'lodash'
import { UserRecord } from '@/modules/core/helpers/types'
import { ServerInviteRecord } from '@/modules/serverinvites/helpers/types'
import { ServerInviteGraphQLReturnType } from '../../helpers/graphTypes'

type PaginationParams = {
  limit: number
  offset: number
  query: string | null
}

type TotalCounts = {
  userCount: number
  inviteCount: number
  totalCount: number
}

type AdminUsersListItem = {
  registeredUser: UserRecord | null
  invitedUser: ServerInviteGraphQLReturnType | null
  id: string
}

type AdminUsersListCollection = {
  totalCount: number
  items: Array<AdminUsersListItem>
}

type UserInvitesFilters = {
  invitesFilter: { offset: number; limit: number } | null
  usersFilter: { offset: number; limit: number } | null
}

/**
 * Sanitizing params to ensure limits aren't too high etc.
 */
function sanitizeParams(params: PaginationParams) {
  params.limit = clamp(params.limit || 10, 1, 200)
  params.offset = Math.max(params.offset || 0, 0)
}

/**
 * Get total users & invites that we can find using these params
 */
async function getTotalCounts(params: PaginationParams): Promise<TotalCounts> {
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

/**
 * Resolve limits & offsets for user & invite queries. All invites will always appear first,
 * and only once there are no more results will users start appearing in the list
 */
function resolveLimitsAndOffsets(
  params: PaginationParams,
  totalCounts: TotalCounts
): UserInvitesFilters {
  const { offset, limit } = params
  const { inviteCount } = totalCounts

  const inviteOffset = offset < inviteCount ? offset : null
  const inviteLimit =
    inviteOffset !== null ? Math.min(inviteCount - offset, limit) : null

  const userOffset = inviteOffset !== null ? 0 : offset - inviteCount
  const userLimit = limit - (inviteLimit || 0)

  return {
    invitesFilter: inviteLimit
      ? { limit: inviteLimit, offset: inviteOffset || 0 }
      : null,
    usersFilter: userLimit ? { limit: userLimit, offset: userOffset } : null
  }
}

function mapUserToListItem(user: UserRecord): AdminUsersListItem {
  return {
    invitedUser: null,
    registeredUser: user,
    id: `user:${user.id}`
  }
}

function mapInviteToListItem(invite: ServerInviteRecord): AdminUsersListItem {
  return {
    registeredUser: null,
    invitedUser: {
      id: invite.id,
      invitedById: invite.inviterId,
      email: resolveTarget(invite.target).userEmail || ''
    },
    id: `invite:${invite.id}`
  }
}

async function retrieveItems(params: PaginationParams, counts: TotalCounts) {
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

/**
 * Resolve admin users list data using the specified filter params
 */
export async function getAdminUsersListCollection(
  params: PaginationParams
): Promise<AdminUsersListCollection> {
  sanitizeParams(params)

  const totalCounts = await getTotalCounts(params)
  const items = await retrieveItems(params, totalCounts)

  return {
    items,
    totalCount: totalCounts.totalCount
  }
}
