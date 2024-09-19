import knex from '@/db/knex'
import { GetActiveUserStreams } from '@/modules/activitystream/domain/operations'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamAcl, StreamActivity } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'

const tables = {
  streamActivity: <T extends object = StreamActivityRecord>(db: Knex) =>
    db<T>(StreamActivity.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
}

export const getActivityFactory =
  ({ db }: { db: Knex }) =>
  async (
    streamId: string,
    start: Date,
    end: Date,
    filteredUser: string | null = null
  ): Promise<StreamScopeActivity[]> => {
    let query = tables
      .streamActivity<StreamScopeActivity>(db)
      .where(StreamActivity.col.streamId, '=', streamId)
      .whereBetween(StreamActivity.col.time, [start, end])
    if (filteredUser) query = query.andWhereNot(StreamActivity.col.userId, filteredUser)
    return await query
  }

export const getActiveUserStreamsFactory =
  ({ db }: { db: Knex }): GetActiveUserStreams =>
  async (start: Date, end: Date) => {
    const query = tables
      .streamAcl(db)
      .select(StreamActivity.col.userId)
      // creates the UserSteams type by aggregating the streamId-s, grouped by userId
      .select(
        knex.raw(`array_agg(distinct ${StreamActivity.name}."streamId") as "streamIds"`)
      )
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
    return (await query) as Awaited<ReturnType<GetActiveUserStreams>>
  }
