import { truncateTables } from '@/test/hooks'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { StreamActivity, Users } from '@/modules/core/dbSchema'
import {
  createActivitySummaryFactory,
  sendActivityNotificationsFactory
} from '@/modules/activitystream/services/summary'
import { expect } from 'chai'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  ActivityDigestMessage,
  NotificationType,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import {
  getActivityFactory,
  saveActivityFactory
} from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import {
  createStreamFactory,
  deleteStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const cleanup = async () => {
  await truncateTables([StreamActivity.name, Users.name])
}

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const saveActivity = saveActivityFactory({ db })
const createActivitySummary = createActivitySummaryFactory({
  getStream,
  getActivity: getActivityFactory({ db }),
  getUser
})
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})
const deleteStream = deleteStreamFactory({ db })

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
        [{ name: 'foo' }, { name: 'bar' }].map(async (stream) =>
          createStream({ ...stream, ownerId: userA.id })
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
        [{ name: 'foo' }, { name: 'bar' }].map(async (stream) =>
          createStream({ ...stream, ownerId: userA.id })
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
      await deleteStream(streamId)
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
