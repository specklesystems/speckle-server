import {
  getActivity,
  getActiveUserStreams
} from '@/modules/activitystream/repositories'
import {
  StreamScopeActivity,
  UserStreams
} from '@/modules/activitystream/helpers/types'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import { getUser } from '@/modules/core/repositories/users'
import { getStream } from '@/modules/core/services/streams'

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
          activity: await getActivity(streamId, start, end, null) //userId is null for now, to not filter out any activity
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

export const sendActivityNotifications = async (
  start: Date,
  end: Date,
  notificationPublisher: NotificationPublisher,
  userActiveStreamsLookup: (
    start: Date,
    end: Date
  ) => Promise<UserStreams[]> = getActiveUserStreams
): Promise<void> => {
  const activeUserStreams = await userActiveStreamsLookup(start, end)
  await Promise.all(
    activeUserStreams.map((userStreams) =>
      notificationPublisher(NotificationType.ActivityDigest, {
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
