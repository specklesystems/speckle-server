import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import {
  CreateActivitySummary,
  GetActiveUserStreams,
  GetActivity
} from '@/modules/activitystream/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { GetUser } from '@/modules/core/domain/users/operations'

export const createActivitySummaryFactory =
  ({
    getStream,
    getActivity,
    getUser
  }: {
    getStream: GetStream
    getActivity: GetActivity
    getUser: GetUser
  }): CreateActivitySummary =>
  async ({
    userId,
    streamIds,
    start,
    end
  }: {
    userId: string
    streamIds: string[]
    start: Date
    end: Date
  }) => {
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
