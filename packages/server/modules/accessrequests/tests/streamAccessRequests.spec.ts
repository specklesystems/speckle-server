import { buildApolloServer } from '@/app'
import { db } from '@/db/knex'
import {
  createNewRequestFactory,
  deleteRequestByIdFactory,
  getPendingAccessRequestFactory,
  getUsersPendingAccessRequestFactory
} from '@/modules/accessrequests/repositories'
import {
  getUserProjectAccessRequestFactory,
  getUserStreamAccessRequestFactory,
  requestProjectAccessFactory,
  requestStreamAccessFactory
} from '@/modules/accessrequests/services/stream'
import { StreamActionTypes } from '@/modules/activitystream/helpers/types'
import { getActivitiesFactory } from '@/modules/activitystream/repositories/index'
import {
  Activity,
  ServerAccessRequests,
  StreamActivity,
  Streams,
  Users
} from '@/modules/core/dbSchema'
import { StreamAccessUpdateError } from '@/modules/core/errors/stream'
import { mapStreamRoleToValue } from '@/modules/core/helpers/graphTypes'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory,
  revokeStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { NotificationType } from '@/modules/notifications/helpers/types'
import { authorizeResolver } from '@/modules/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUsers } from '@/test/authHelper'
import {
  createStreamAccessRequest,
  getFullStreamAccessRequest,
  getPendingStreamAccessRequests,
  getStreamAccessRequest,
  useStreamAccessRequest
} from '@/test/graphql/accessRequests'
import { StreamRole } from '@/modules/core/graph/generated/graphql'
import type { ServerAndContext } from '@/test/graphqlHelper'
import { createAuthedTestContext } from '@/test/graphqlHelper'
import { truncateTables } from '@/test/hooks'
import type { NotificationsStateManager } from '@/test/notificationsHelper'
import { buildNotificationsStateTracker } from '@/test/notificationsHelper'
import { getStreamActivities } from '@/test/speckle-helpers/activityStreamHelper'
import type { TestEmailListener } from '@/test/speckle-helpers/email'
import { createEmailListener } from '@/test/speckle-helpers/email'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import { noop } from 'lodash-es'

const getUser = getUserFactory({ db })
const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
const getStream = getStreamFactory({ db })
const requestStreamAccess = requestStreamAccessFactory({
  requestProjectAccess: requestProjectAccessFactory({
    getUserStreamAccessRequest: getUserStreamAccessRequestFactory({
      getUserProjectAccessRequest: getUserProjectAccessRequestFactory({
        getUsersPendingAccessRequest: getUsersPendingAccessRequestFactory({ db })
      })
    }),
    getStream,
    createNewRequest: createNewRequestFactory({ db }),
    emitEvent: getEventBus().emit
  })
})
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})
const getActivities = getActivitiesFactory({ db })

const isNotCollaboratorError = (e: unknown) =>
  e instanceof StreamAccessUpdateError &&
  e.message.includes('User is not a stream collaborator')

const createReqAndGetId = async (userId: string, streamId: string) => {
  const createReqRes = await requestStreamAccess(userId, streamId)
  return createReqRes.id
}

const cleanup = async () => {
  await truncateTables([Streams.name, ServerAccessRequests.name, Users.name])
}

describe('Stream access requests', () => {
  let apollo: ServerAndContext
  let notificationsStateManager: NotificationsStateManager

  const me: BasicTestUser = {
    name: 'hello itsa me',
    email: '',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'and im the other guy, hi!',
    email: '',
    id: ''
  }

  const anotherGuy: BasicTestUser = {
    name: 'and im another guy lol',
    email: '',
    id: ''
  }

  const otherGuysPrivateStream: BasicTestStream = {
    name: 'other guys test stream #1',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  const otherGuysPublicStream: BasicTestStream = {
    name: 'other guys public test stream #2',
    isPublic: true,
    ownerId: '',
    id: ''
  }

  const myPrivateStream: BasicTestStream = {
    name: 'this is my private stream #1',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  let emailListener: TestEmailListener

  before(async () => {
    await cleanup()
    await createTestUsers([me, otherGuy, anotherGuy])
    await createTestStreams([
      [otherGuysPrivateStream, otherGuy],
      [otherGuysPublicStream, otherGuy],
      [myPrivateStream, me]
    ])
    apollo = {
      apollo: await buildApolloServer(),
      context: await createAuthedTestContext(me.id)
    }
    notificationsStateManager = buildNotificationsStateTracker()
    emailListener = await createEmailListener()
  })

  after(async () => {
    notificationsStateManager.destroy()
    await emailListener.destroy()
  })

  afterEach(async () => {
    emailListener.reset()
  })

  const createReq = (streamId: string) =>
    createStreamAccessRequest(apollo, { streamId })

  const getReq = (streamId: string) => getStreamAccessRequest(apollo, { streamId })

  const getStreamReqs = (streamId: string) =>
    getPendingStreamAccessRequests(apollo, { streamId })

  const useReq = (
    requestId: string,
    accept: boolean,
    role: StreamRole = StreamRole.StreamContributor
  ) => useStreamAccessRequest(apollo, { requestId, accept, role })

  describe('when being created', () => {
    beforeEach(async () => {
      await truncateTables([ServerAccessRequests.name, StreamActivity.name])
    })

    afterEach(async () => {
      // Ensure me doesnt have any roles on stream1
      await removeStreamCollaborator(otherGuysPrivateStream.id, me.id, me.id).catch(
        (e) => {
          if (!isNotCollaboratorError(e)) throw e
        }
      )
    })

    it('operation succeeds', async () => {
      const { getSends } = emailListener.listen({ times: 1 })

      const waitForAck = notificationsStateManager.waitForAck(
        (e) => e.result?.type === NotificationType.NewStreamAccessRequest
      )

      const results = await createReq(otherGuysPrivateStream.id)

      // req gets created
      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.streamAccessRequestCreate.id).to.be.ok
      expect(results.data?.streamAccessRequestCreate?.createdAt).to.be.ok
      expect(results.data?.streamAccessRequestCreate?.requesterId).to.be.ok
      expect(results.data?.streamAccessRequestCreate?.requester.id).to.eq(
        results.data?.streamAccessRequestCreate?.requesterId
      )
      expect(results.data?.streamAccessRequestCreate.streamId).to.be.ok

      await waitForAck

      // email gets sent out
      const sentEmails = getSends()
      expect(sentEmails.length).to.eq(1)
      const emailParams = sentEmails[0]

      expect(emailParams.subject).to.contain('A user requested access to your project')
      expect(emailParams.html).to.be.ok
      expect(emailParams.text).to.be.ok
      expect(emailParams.to).to.eq(otherGuy.email)

      // activity stream item inserted
      const streamActivity = await getStreamActivities(otherGuysPrivateStream.id, {
        actionType: StreamActionTypes.Stream.AccessRequestSent,
        userId: me.id
      })
      expect(streamActivity).to.have.lengthOf(1)
    })

    it('operation fails if request already exists', async () => {
      const firstResults = await createReq(otherGuysPrivateStream.id)
      expect(firstResults).to.not.haveGraphQLErrors()
      expect(firstResults.data?.streamAccessRequestCreate.id).to.be.ok

      const secondResults = await createReq(otherGuysPrivateStream.id)
      expect(secondResults).to.haveGraphQLErrors('already has a pending access request')
      expect(secondResults.data?.streamAccessRequestCreate.id).to.be.not.ok
    })

    it('operation fails if stream is nonexistant', async () => {
      const secondResults = await createReq('abcdef123')
      expect(secondResults).to.haveGraphQLErrors('non-existant resource')
      expect(secondResults.data?.streamAccessRequestCreate.id).to.be.not.ok
    })

    it('operation fails if user already has a role on the stream', async () => {
      await addOrUpdateStreamCollaborator(
        otherGuysPrivateStream.id,
        me.id,
        Roles.Stream.Contributor,
        otherGuy.id
      )

      const secondResults = await createReq(otherGuysPrivateStream.id)
      expect(secondResults).to.haveGraphQLErrors('user already has access')
      expect(secondResults.data?.streamAccessRequestCreate.id).to.be.not.ok
    })
  })

  describe('when being read', () => {
    let myRequestId: string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let myPublicReqId: string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let anotherGuysRequestId: string

    beforeEach(async () => {
      await truncateTables([ServerAccessRequests.name])

      const [myNewReqId, anotherGuysNewReqId, myNewPublicReqId] = await Promise.all([
        createReqAndGetId(me.id, otherGuysPrivateStream.id),
        createReqAndGetId(anotherGuy.id, otherGuysPrivateStream.id),
        createReqAndGetId(me.id, otherGuysPublicStream.id)
      ])
      myRequestId = myNewReqId
      anotherGuysRequestId = anotherGuysNewReqId
      myPublicReqId = myNewPublicReqId
    })

    it('returns the request correctly', async () => {
      const results = await getReq(otherGuysPrivateStream.id)
      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.streamAccessRequest?.id).to.eq(myRequestId)
      expect(results.data?.streamAccessRequest?.createdAt).to.be.ok
      expect(results.data?.streamAccessRequest?.requesterId).to.be.ok
      expect(results.data?.streamAccessRequest?.requester.id).to.eq(
        results.data?.streamAccessRequest?.requesterId
      )
      expect(results.data?.streamAccessRequest?.streamId).to.be.ok
    })

    it('returns null if no req found', async () => {
      await deleteRequestByIdFactory({ db })(myRequestId)

      const results = await getReq(otherGuysPrivateStream.id)
      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.streamAccessRequest).to.eq(null)
    })

    it('throws error if attempting to read private stream metadata before has access to it', async () => {
      const results = await getFullStreamAccessRequest(apollo, {
        streamId: otherGuysPrivateStream.id
      })

      expect(results).to.haveGraphQLErrors(
        'User does not have required access to stream'
      )
    })

    it('doesnt throw if attempting to read stream metadata on accessible stream', async () => {
      const results = await getFullStreamAccessRequest(apollo, {
        streamId: otherGuysPublicStream.id
      })

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.streamAccessRequest?.stream.id).to.be.ok
    })
  })

  describe('when being read from a stream', () => {
    before(async () => {
      await truncateTables([ServerAccessRequests.name])

      await addOrUpdateStreamCollaborator(
        otherGuysPublicStream.id,
        me.id,
        Roles.Stream.Contributor,
        otherGuy.id
      )
      await Promise.all([
        createReqAndGetId(otherGuy.id, myPrivateStream.id),
        createReqAndGetId(anotherGuy.id, myPrivateStream.id)
      ])
    })

    after(async () => {
      await removeStreamCollaborator(otherGuysPublicStream.id, me.id, me.id).catch(noop)
    })

    it(`operation fails if reading from a non-owned stream`, async () => {
      const results = await getStreamReqs(otherGuysPublicStream.id)
      expect(results).to.haveGraphQLErrors('not authorized')
      expect(results.data?.stream?.pendingAccessRequests).to.be.not.ok
      expect(results.data?.stream?.id).to.be.ok
    })

    it('operation succeeds', async () => {
      const results = await getStreamReqs(myPrivateStream.id)
      expect(results).to.not.haveGraphQLErrors()

      expect(results.data?.stream?.pendingAccessRequests).to.have.lengthOf(2)

      for (const pendingReq of results.data!.stream!.pendingAccessRequests!) {
        expect(pendingReq.id).to.be.ok
        expect(pendingReq.createdAt).to.be.ok
        expect(pendingReq.requesterId).to.be.ok
        expect(pendingReq.streamId).to.be.ok
        expect(pendingReq.stream.id).to.eq(results.data!.stream!.id)
        expect(pendingReq.requester.id).to.eq(pendingReq.requesterId)
        expect([otherGuy.id, anotherGuy.id].includes(pendingReq.requesterId)).to.be.true
      }
    })
  })

  describe('when being processed', () => {
    let validReqId: string

    beforeEach(async () => {
      await truncateTables([
        ServerAccessRequests.name,
        StreamActivity.name,
        Activity.name
      ])
      await removeStreamCollaborator(
        myPrivateStream.id,
        otherGuy.id,
        otherGuy.id
      ).catch((e) => {
        if (!isNotCollaboratorError(e)) throw e
      })
      validReqId = await createReqAndGetId(otherGuy.id, myPrivateStream.id)
    })

    it('processing fails when pointing to nonexistant req', async () => {
      const results = await useReq('abcd', true)
      expect(results).to.haveGraphQLErrors('no request with this id exists')
      expect(results.data?.streamAccessRequestUse).to.be.not.ok
    })

    it('processing fails when pointing to a req the user doesnt have access to', async () => {
      const inaccessibleReqId = await createReqAndGetId(
        anotherGuy.id,
        otherGuysPrivateStream.id
      )

      const results = await useReq(inaccessibleReqId, true)
      expect(results).to.haveGraphQLErrors('you must own the stream')
      expect(results.data?.streamAccessRequestUse).to.be.not.ok
    })

    const validProcessingDataSet = [
      { display: 'declining', accept: false },
      { display: 'approving', accept: true },
      {
        display: 'approving with custom role',
        accept: true,
        role: StreamRole.StreamReviewer
      }
    ]
    validProcessingDataSet.forEach(({ display, accept, role }) => {
      it(`${display} works`, async () => {
        const results = await useReq(validReqId, accept, role)
        expect(results).to.not.haveGraphQLErrors()
        expect(results.data?.streamAccessRequestUse).to.be.ok

        // req should be deleted
        const req = await getPendingAccessRequestFactory({ db })(validReqId)
        expect(req).to.not.be.ok

        // activity stream item should be inserted
        if (accept) {
          const streamActivity = await getActivities({
            projectId: myPrivateStream.id,
            userId: me.id,
            eventType: 'project_role_updated'
          })
          expect(streamActivity).to.have.lengthOf(1)

          const collaborators = await getStreamCollaborators(myPrivateStream.id)
          const newCollaborator = collaborators.find((c) => c.id === otherGuy.id)

          expect(newCollaborator).to.be.ok
          expect(newCollaborator?.streamRole).to.eq(
            role ? mapStreamRoleToValue(role) : Roles.Stream.Contributor
          )
        } else {
          const streamActivity = await getStreamActivities(myPrivateStream.id, {
            actionType: StreamActionTypes.Stream.AccessRequestDeclined,
            userId: me.id
          })
          expect(streamActivity).to.have.lengthOf(1)
        }
      })
    })
  })
})
