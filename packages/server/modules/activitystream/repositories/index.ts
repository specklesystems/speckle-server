import knex from '@/db/knex'
import { StreamScopeActivity } from '@/modules/activitystream/helpers/types'
import { StreamActivity } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'

export const getActivity = async (
  streamId: string,
  start: Date,
  end: Date,
  filteredUser: string | null = null
): Promise<StreamScopeActivity[]> => {
  let query = StreamActivity.knex()
    .where(StreamActivity.col.streamId, '=', streamId)
    .whereBetween(StreamActivity.col.time, [start, end])
  if (filteredUser) query = query.andWhereNot(StreamActivity.col.userId, filteredUser)
  return await query
}

export const getActiveUserStreams = async (
  start: Date,
  end: Date
): Promise<UserStreams[]> => {
  const query = knex
    .select(StreamActivity.col.userId)
    // creates the UserSteams type by aggregating the streamId-s, grouped by userId
    .select(
      knex.raw(`array_agg(distinct ${StreamActivity.name}."streamId") as "streamIds"`)
    )
    .from('stream_acl')
    .groupBy(StreamActivity.col.userId)
    .join(
      StreamActivity.name,
      StreamActivity.col.streamId,
      '=',
      'stream_acl.resourceId'
    )
    .whereBetween(StreamActivity.col.time, [start, end])
    // make sure archived users do not counted for activity
    .join('server_acl', 'server_acl.userId', '=', StreamActivity.col.userId)
    .whereNot('server_acl.role', '=', Roles.Server.ArchivedUser)
  return await query
}

export type UserStreams = {
  userId: string
  streamIds: string[]
}
