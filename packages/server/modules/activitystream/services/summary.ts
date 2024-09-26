import { getActivityFactory } from '@/modules/activitystream/repositories'
import { StreamScopeActivity } from '@/modules/activitystream/helpers/types'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import { getUser } from '@/modules/core/repositories/users'
import { getStream } from '@/modules/core/services/streams'
import { db } from '@/db/knex'
import { GetActiveUserStreams } from '@/modules/activitystream/domain/operations'

export type StreamActivitySummary = {
  stream: StreamRecord | null
  activity: StreamScopeActivity[]
}

export type ActivitySummary = {
  user: UserRecord
  streamActivities: StreamActivitySummary[]
}

export const createActivitySummary = async (
  userId: string,
  streamIds: string[],
  start: Date,
  end: Date
): Promise<ActivitySummary | null> => {
  const streamActivities = (
    await Promise.all(
      streamIds.map(async (streamId) => {
        return {
          stream: (await getStream({ streamId, userId })) ?? null,
          activity: await getActivityFactory({ db })(streamId, start, end, null) //userId is null for now, to not filter out any activity
        }
      })
    )
  ).filter((sa) => sa.activity.length)
  const user = await getUser(userId)
  if (!user) return null
  return {
    user,
    streamActivities
  }
}

export const sendActivityNotificationsFactory =
  ({
    publishNotification,
    getActiveUserStreams
  }: {
    publishNotification: NotificationPublisher
    getActiveUserStreams: GetActiveUserStreams
  }) =>
  async (start: Date, end: Date): Promise<void> => {
    const activeUserStreams = await getActiveUserStreams(start, end)
    await Promise.all(
      activeUserStreams.map((userStreams) =>
        publishNotification(NotificationType.ActivityDigest, {
          targetUserId: userStreams.userId,
          data: {
            streamIds: userStreams.streamIds,
            start,
            end
          }
        })
      )
    )
  }
