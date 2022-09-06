import knex from '@/db/knex'
import {
  StreamScopeActivity,
  UserStreams
} from '@/modules/activitystream/services/types'
import { Activities } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'

export const getActivity = async (
  streamId: string,
  start: Date,
  end: Date,
  filteredUser: string | null = null
): Promise<StreamScopeActivity[]> => {
  let query = Activities.knex()
    .where(Activities.col.streamId, '=', streamId)
    .whereBetween(Activities.col.time, [start, end])
  if (filteredUser) query = query.andWhereNot(Activities.col.userId, '=', filteredUser)
  return await query
}

export const getActiveUserStreams = async (
  start: Date,
  end: Date
): Promise<UserStreams[]> => {
  const query = knex
    .select(Activities.col.userId)
    // creates the UserSteams type by aggregating the streamId-s, grouped by userId
    .select(
      knex.raw(`array_agg(distinct ${Activities.name}."streamId") as "streamIds"`)
    )
    .from('stream_acl')
    .groupBy(Activities.col.userId)
    .join(Activities.name, Activities.col.streamId, '=', 'stream_acl.resourceId')
    .whereBetween(Activities.col.time, [start, end])
    // make sure archived users do not counted for activity
    .join('server_acl', 'server_acl.userId', '=', Activities.col.userId)
    .whereNot('server_acl.role', '=', Roles.Server.ArchivedUser)
  return await query
}
