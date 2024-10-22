import db from '@/db/knex'
import {
  AdminGetInviteList,
  AdminUserList,
  CountUsers,
  ListPaginatedUsersPage
} from '@/modules/core/domain/users/operations'
import { StreamRecord } from '@/modules/core/helpers/types'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import {
  CountServerInvites,
  QueryServerInvites
} from '@/modules/serverinvites/domain/operations'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import { BaseError } from '@/modules/shared/errors/base'

type HasCursor = {
  cursor: string | null
}

type Collection<T> = HasCursor & {
  items: T[]
  totalCount: number
}

class CursorParsingError extends BaseError {
  static defaultMessage = 'Invalid cursor provided'
  static code = 'INVALID_CURSOR_VALUE'
  static statusCode = 400
}

const parseCursorToDate = (cursor: string): Date => {
  const timestamp = Date.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
  if (isNaN(timestamp)) throw new CursorParsingError()
  return new Date(timestamp)
}

const convertDateToCursor = (date: Date): string =>
  Buffer.from(date.toISOString()).toString('base64')

export const adminUserListFactory =
  (deps: {
    listUsers: ListPaginatedUsersPage
    countUsers: CountUsers
  }): AdminUserList =>
  async (args) => {
    const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
    const [items, totalCount] = await Promise.all([
      deps.listUsers({
        role: args.role,
        cursor: parsedCursor,
        limit: args.limit,
        query: args.query ?? null
      }),
      deps.countUsers(args)
    ])
    const cursor = items.length
      ? convertDateToCursor(items.slice(-1)[0].createdAt)
      : null
    return { totalCount, items, cursor }
  }

type AdminProjectListArgs = HasCursor & {
  query: string | null
  orderBy: string | null
  visibility: string | null
  limit: number
}

export const adminInviteListFactory =
  (deps: {
    countServerInvites: CountServerInvites
    queryServerInvites: QueryServerInvites
  }): AdminGetInviteList =>
  async (args) => {
    const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
    const [totalCount, inviteItems] = await Promise.all([
      deps.countServerInvites(args.query),
      deps.queryServerInvites(args.query, args.limit, parsedCursor)
    ])
    const items = inviteItems.map((invite: ServerInviteRecord) => {
      return {
        id: invite.id,
        invitedById: invite.inviterId,
        email: invite.target
      }
    })
    const cursor = inviteItems.length
      ? convertDateToCursor(inviteItems.slice(-1)[0].createdAt)
      : null
    return {
      totalCount,
      items,
      cursor
    }
  }

export const adminProjectList = async (
  args: AdminProjectListArgs & { streamIdWhitelist?: string[] }
): Promise<Collection<StreamRecord>> => {
  const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
  const getStreams = legacyGetStreamsFactory({ db })
  const { streams, totalCount, cursorDate } = await getStreams({
    ...args,
    searchQuery: args.query,
    cursor: parsedCursor,
    streamIdWhitelist: args.streamIdWhitelist,
    workspaceIdWhitelist: null,
    offset: null,
    publicOnly: null
  })
  const cursor = cursorDate ? convertDateToCursor(cursorDate) : null
  return {
    cursor,
    items: streams,
    totalCount
  }
}
