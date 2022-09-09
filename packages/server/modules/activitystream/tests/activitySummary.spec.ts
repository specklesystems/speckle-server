import { truncateTables } from '@/test/hooks'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { StreamActivity, Users } from '@/modules/core/dbSchema'
import {
  createActivitySummary,
  sendActivityNotifications
} from '@/modules/activitystream/services/summary'
import { expect } from 'chai'
import { createStream, deleteStream } from '@/modules/core/services/streams'
import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  ActivityDigestMessage,
  NotificationType,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import { sleep } from '@/test/helpers'

const cleanup = async () => {
  await truncateTables([StreamActivity.name, Users.name])
}

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
      const summary = await createActivitySummary(
        'notAUserId',
        ['someStreamIds'],
        new Date(),
        new Date()
      )
      expect(summary).to.be.null
    })
    it('no activity returns empty summary', async () => {
      const start = new Date()
      const streamIds = await Promise.all(
        [{ name: 'foo' }, { name: 'bar' }].map(async (stream) =>
          createStream({ ...stream, ownerId: userA.id })
        )
      )

      const summary = await createActivitySummary(
        userA.id,
        streamIds,
        start,
        new Date()
      )

      expect(summary?.streamActivities).to.have.length(0)
    })
    it('gets activities for the user', async () => {
      const start = new Date()
      const streamIds = await Promise.all(
        [{ name: 'foo' }, { name: 'bar' }].map(async (stream) =>
          createStream({ ...stream, ownerId: userA.id })
        )
      )
      await saveActivity({
        streamId: streamIds[0],
        resourceType: ResourceTypes.Stream,
        resourceId: streamIds[0],
        actionType: ActionTypes.Stream.Create,
        userId: userA.id,
        info: {},
        message: 'foo'
      })
      await sleep(100)
      const summary = await createActivitySummary(
        userA.id,
        streamIds,
        start,
        new Date()
      )

      expect(summary?.streamActivities).to.have.length(1)
    })

    it('if stream is deleted, activity summary returns with null as stream value', async () => {
      const start = new Date()
      const [streamId] = await Promise.all(
        [{ name: 'foo' }].map(async (stream) =>
          createStream({ ...stream, ownerId: userA.id })
        )
      )
      await saveActivity({
        streamId,
        resourceType: ResourceTypes.Stream,
        resourceId: streamId,
        actionType: ActionTypes.Stream.Create,
        userId: userA.id,
        info: {},
        message: 'foo'
      })
      await deleteStream({ streamId })
      const summary = await createActivitySummary(
        userA.id,
        [streamId],
        start,
        new Date()
      )

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
      await sendActivityNotifications(
        new Date(),
        new Date(),
        notificationPublisher.publish.bind(notificationPublisher),
        async () => []
      )

      expect(notificationPublisher.notifications.length).to.equal(0)
    })

    it('for each UserStream a notification is sent', async () => {
      const userStreams = [
        { userId: 'foo', streamIds: ['bar'] },
        { userId: 'boo', streamIds: ['tic', 'tac', 'toe'] }
      ]
      const notificationPublisher = new FakeNotificationPublisher()
      await sendActivityNotifications(
        new Date(),
        new Date(),
        notificationPublisher.publish.bind(notificationPublisher),
        async () => userStreams
      )

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
