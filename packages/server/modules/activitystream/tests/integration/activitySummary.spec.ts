import { truncateTables } from '@/test/hooks'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUsers } from '@/test/authHelper'
import { StreamActivity, Users } from '@/modules/core/dbSchema'
import {
  createActivitySummaryFactory,
  sendActivityNotificationsFactory
} from '@/modules/activitystream/services/summary'
import { expect } from 'chai'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import type {
  ActivityDigestMessage,
  NotificationType,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import {
  geUserStreamActivityFactory,
  saveStreamActivityFactory
} from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { deleteProjectAndCommitsFactory } from '@/modules/core/services/projects'
import { deleteProjectFactory } from '@/modules/core/repositories/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'

const cleanup = async () => {
  await truncateTables([StreamActivity.name, Users.name])
}

const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const saveActivity = saveStreamActivityFactory({ db })
const createActivitySummary = createActivitySummaryFactory({
  getStream,
  getActivity: geUserStreamActivityFactory({ db }),
  getUser
})
const deleteStreamAndCommits = deleteProjectAndCommitsFactory({
  deleteProject: deleteProjectFactory({ db }),
  deleteProjectCommits: deleteProjectCommitsFactory({ db })
})

describe('Activity summary @activity', () => {
  const userA: BasicTestUser = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    id: ''
  }
  before(async () => {
    await cleanup()
    await createTestUsers([userA])
  })
  describe('create activity summary', () => {
    it('returns null for non existing users', async () => {
      const summary = await createActivitySummary({
        userId: 'notAUserId',
        streamIds: ['someStreamIds'],
        start: new Date(),
        end: new Date()
      })
      expect(summary).to.be.null
    })
    it('no activity returns empty summary', async () => {
      const start = new Date()
      const streamIds = await Promise.all(
        [{ name: 'foo' }, { name: 'bar' }].map(
          async (stream) => (await createTestStream(stream, userA)).id
        )
      )

      const summary = await createActivitySummary({
        userId: userA.id,
        streamIds,
        start,
        end: new Date()
      })

      // stream creation is an activity
      expect(summary?.streamActivities).to.have.length(2)
    })
    it('gets activities for the user', async () => {
      const start = new Date()
      const streamIds = await Promise.all(
        [{ name: 'foo' }, { name: 'bar' }].map(
          async (stream) => (await createTestStream(stream, userA)).id
        )
      )
      const summary = await createActivitySummary({
        userId: userA.id,
        streamIds,
        start,
        end: new Date()
      })

      expect(summary?.streamActivities).to.have.length(2)
    })

    it('if stream is deleted, activity summary returns with null as stream value', async () => {
      const start = new Date()
      const [streamId] = await Promise.all(
        [{ name: 'foo' }].map(
          async (stream) => (await createTestStream(stream, userA)).id
        )
      )
      await saveActivity({
        streamId,
        resourceType: StreamResourceTypes.Stream,
        resourceId: streamId,
        actionType: StreamActionTypes.Stream.Create,
        userId: userA.id,
        info: {},
        message: 'foo'
      })
      await deleteStreamAndCommits({ projectId: streamId })
      const summary = await createActivitySummary({
        userId: userA.id,
        streamIds: [streamId],
        start,
        end: new Date()
      })

      expect(summary?.streamActivities).to.have.length(1)
      expect(summary?.streamActivities[0].stream).to.be.null
    })
  })

  type NotificationMessage<T extends NotificationType> = {
    type: T
    params: Omit<NotificationTypeMessageMap[T], 'type'>
  }

  class FakeNotificationPublisher {
    notifications: NotificationMessage<NotificationType>[] = []

    async publish<T extends NotificationType>(
      type: T,
      params: Omit<NotificationTypeMessageMap[T], 'type'>
    ): Promise<string | number> {
      this.notifications.push({ type, params })
      return this.notifications.length
    }

    constructor() {
      this.notifications = []
    }
  }

  describe('send activity notifications', () => {
    it('sends no notifications if there are no active streams', async () => {
      const notificationPublisher = new FakeNotificationPublisher()
      await sendActivityNotificationsFactory({
        publishNotification: notificationPublisher.publish.bind(notificationPublisher),
        getActiveUserStreams: async () => []
      })(new Date(), new Date())

      expect(notificationPublisher.notifications.length).to.equal(0)
    })

    it('for each UserStream a notification is sent', async () => {
      const userStreams = [
        { userId: 'foo', streamIds: ['bar'] },
        { userId: 'boo', streamIds: ['tic', 'tac', 'toe'] }
      ]
      const notificationPublisher = new FakeNotificationPublisher()
      await sendActivityNotificationsFactory({
        publishNotification: notificationPublisher.publish.bind(notificationPublisher),
        getActiveUserStreams: async () => userStreams
      })(new Date(), new Date())

      expect(
        notificationPublisher.notifications
          .map((n) => n.params)
          .filter((p): p is ActivityDigestMessage => true)
          .map((n) => ({
            userId: n.targetUserId,
            streamIds: n.data.streamIds
          }))
      ).to.be.deep.equalInAnyOrder(userStreams)
    })
  })
})
