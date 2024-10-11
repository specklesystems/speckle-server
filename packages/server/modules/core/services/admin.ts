import db from '@/db/knex'
import { ServerInviteGraphQLReturnType } from '@/modules/core/helpers/graphTypes'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { listUsers, countUsers } from '@/modules/core/repositories/users'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import {
  countServerInvitesFactory,
  queryServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { BaseError } from '@/modules/shared/errors/base'
import { ServerRoles } from '@speckle/shared'

type HasCursor = {
  cursor: string | null
}

type HasQuery = {
  query: string | null
}

type Collection<T> = HasCursor & {
  items: T[]
  totalCount: number
}

type HasLimit = {
  limit: number
}

type CollectionQueryArgs = HasCursor & HasQuery & HasLimit

type AdminUserListArgs = CollectionQueryArgs & {
  role: ServerRoles | null
}

export class CursorParsingError extends BaseError {
  static defaultMessage = 'Invalid cursor provided'
  static code = 'INVALID_CURSOR_VALUE'
  static statusCode = 400
}

export const parseCursorToDate = (cursor: string): Date => {
  const timestamp = Date.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
  if (isNaN(timestamp)) throw new CursorParsingError()
  return new Date(timestamp)
}

export const convertDateToCursor = (date: Date): string =>
  Buffer.from(date.toISOString()).toString('base64')

export const adminUserList = async (
  args: AdminUserListArgs
): Promise<Collection<UserRecord>> => {
  const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
  const [items, totalCount] = await Promise.all([
    listUsers({
      role: args.role,
      cursor: parsedCursor,
      limit: args.limit,
      query: args.query ?? null
    }),
    countUsers(args)
  ])
  const cursor = items.length ? convertDateToCursor(items.slice(-1)[0].createdAt) : null
  return { totalCount, items, cursor }
}

type AdminProjectListArgs = HasCursor & {
  query: string | null
  orderBy: string | null
  visibility: string | null
  limit: number
}

export const adminInviteList = async (
  args: CollectionQueryArgs
): Promise<Collection<ServerInviteGraphQLReturnType>> => {
  const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
  // TODO: injection
  const [totalCount, inviteItems] = await Promise.all([
    countServerInvitesFactory({ db })(args.query),
    queryServerInvitesFactory({ db })(args.query, args.limit, parsedCursor)
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
