import knex from '@/db/knex'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamActivity as StreamActivitySchema } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'

const StreamActivity = () => StreamActivitySchema.knex<StreamActivityRecord[]>()

export const getActivity = async (
  streamId: string,
  start: Date,
  end: Date,
  filteredUser: string | null = null
): Promise<StreamScopeActivity[]> => {
  let query = StreamActivity()
    .where(StreamActivitySchema.col.streamId, '=', streamId)
    .whereBetween(StreamActivitySchema.col.time, [start, end])
  if (filteredUser)
    query = query.andWhereNot(StreamActivitySchema.col.userId, filteredUser)
  return await query
}

export const getActiveUserStreams = async (
  start: Date,
  end: Date
): Promise<UserStreams[]> => {
  const query = knex
    .select(StreamActivitySchema.col.userId)
    // creates the UserSteams type by aggregating the streamId-s, grouped by userId
    .select(
      knex.raw(`array_agg(distinct ${StreamActivity.name}."streamId") as "streamIds"`)
    )
    .from('stream_acl')
    .groupBy(StreamActivitySchema.col.userId)
    .join(
      StreamActivity.name,
      StreamActivitySchema.col.streamId,
      '=',
      'stream_acl.resourceId'
    )
    .whereBetween(StreamActivitySchema.col.time, [start, end])
    // make sure archived users do not counted for activity
    .join('server_acl', 'server_acl.userId', '=', StreamActivitySchema.col.userId)
    .whereNot('server_acl.role', '=', Roles.Server.ArchivedUser)
  return await query
}

export type UserStreams = {
  userId: string
  streamIds: string[]
}
