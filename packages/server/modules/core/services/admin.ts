import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import { listUsers, countUsers } from '@/modules/core/repositories/users'
import { getStreams } from '@/modules/core/services/streams'
import { BaseError } from '@/modules/shared/errors/base'
import { ServerRoles } from '@speckle/shared'

type HasCursor = {
  cursor: string | null
}

type Collection<T> = HasCursor & {
  items: T[]
  totalCount: number
}

type AdminUserListArgs = HasCursor & {
  limit: number
  query: string | null
  role: ServerRoles | null
}

export class CursorParsingError extends BaseError {
  static defaultMessage = 'Invalid cursor provided'
  static code = 'INVALID_CURSOR_VALUE'
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

export const adminProjectList = async (
  args: AdminProjectListArgs
): Promise<Collection<StreamRecord>> => {
  const parsedCursor = args.cursor ? parseCursorToDate(args.cursor) : null
  const { streams, totalCount, cursorDate } = await getStreams({
    ...args,
    searchQuery: args.query,
    cursor: parsedCursor
  })
  const cursor = cursorDate ? convertDateToCursor(cursorDate) : null
  return {
    cursor,
    items: streams,
    totalCount
  }
}
