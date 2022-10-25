import { expect } from 'chai'
import {
  createStream,
  getStream,
  updateStream,
  deleteStream,
  getStreamUsers,
  grantPermissionsStream,
  revokePermissionsStream
} from '../services/streams'
import {
  createBranch,
  getBranchByNameAndStreamId,
  deleteBranchById
} from '../services/branches'
import { createObject } from '../services/objects'
import { createCommitByBranchName } from '../services/commits'

import { beforeEachContext, truncateTables } from '@/test/hooks'
import {
  addOrUpdateStreamCollaborator,
  isStreamCollaborator
} from '@/modules/core/services/streams/streamAccessService'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  buildAuthenticatedApolloServer,
  buildUnauthenticatedApolloServer
} from '@/test/serverHelper'
import {
  getLimitedUserStreams,
  getUserStreams,
  leaveStream
} from '@/test/graphql/streams'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  BasicTestStream,
  createTestStream,
  createTestStreams
} from '@/test/speckle-helpers/streamHelper'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { has, times } from 'lodash'
import { Streams } from '@/modules/core/dbSchema'
import { ApolloServer } from 'apollo-server-express'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { sleep } from '@/test/helpers'
import dayjs, { Dayjs } from 'dayjs'
import {
  GetLimitedUserStreamsQuery,
  GetUserStreamsQuery
} from '@/test/graphql/generated/graphql'
import { Get } from 'type-fest'

describe('Streams @core-streams', () => {
  const userOne: BasicTestUser = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const userTwo: BasicTestUser = {
    name: 'Dimitrie Stefanescu 2',
    email: 'didimitrie2@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const testStream: BasicTestStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream',
    isPublic: true,
    ownerId: '',
    id: ''
  }

  const secondTestStream: BasicTestStream = {
    name: 'Test Stream 02',
    description: 'wot',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  const userLimitedUserDataSet = [
    { display: 'User', limitedUser: false },
    { display: 'LimitedUser', limitedUser: true }
  ]

  before(async () => {
    await beforeEachContext()

    await createTestUsers([userOne, userTwo])
    await createTestStreams([
      [testStream, userOne],
      [secondTestStream, userOne]
    ])
  })

  describe('Create, Read, Update, Delete Streams', () => {
    it('Should create a stream', async () => {
      const stream1Id = await createStream({ ...testStream, ownerId: userOne.id })
      expect(stream1Id).to.not.be.null

      const stream2Id = await createStream({
        ...secondTestStream,
        ownerId: userOne.id
      })
      expect(stream2Id).to.not.be.null
    })

    it('Should get a stream', async () => {
      const stream = await getStream({ streamId: testStream.id })
      expect(stream).to.not.be.null
    })

    it('Should update a stream', async () => {
      await updateStream({
        id: testStream.id,
        name: 'Modified Name',
        description: 'Wooot'
      })
      const stream = await getStream({ streamId: testStream.id })
      expect(stream?.name).to.equal('Modified Name')
      expect(stream?.description).to.equal('Wooot')
    })

    // it('Should get all streams of a user', async () => {
    //   const { streams, cursor } = await getUserStreams({ userId: userOne.id })

    //   expect(streams).to.be.ok
    //   expect(cursor).to.be.ok
    //   expect(streams).to.not.be.empty
    // })

    // it('Should search all streams of a user', async () => {
    //   const { streams, cursor } = await getUserStreams({
    //     userId: userOne.id,
    //     searchQuery: 'woo'
    //   })
    //   // console.log( res )
    //   expect(streams).to.have.lengthOf(1)
    //   expect(cursor).to.exist
    // })

    it('Should delete a stream', async () => {
      const id = await createStream({
        name: 'mayfly',
        description: 'wonderful',
        ownerId: userOne.id
      })

      await deleteStream({ streamId: id })
      const stream = await getStream({ streamId: id })

      expect(stream).to.not.be.ok
    })
  })

  describe('Sharing: Grant & Revoke permissions', () => {
    before(async () => {
      await addOrUpdateStreamCollaborator(
        testStream.id,
        userTwo.id,
        Roles.Stream.Contributor,
        userOne.id
      )
    })

    it('Should get the users with access to a stream', async () => {
      const users = await getStreamUsers({ streamId: testStream.id })
      expect(users).to.have.lengthOf(2)
      expect(users[0]).to.not.have.property('email')
      expect(users[0]).to.have.property('id')
    })

    it('Should revoke permissions on stream', async () => {
      await revokePermissionsStream({ streamId: testStream.id, userId: userTwo.id })
      const streamWithRole = await getStream({
        streamId: testStream.id,
        userId: userTwo.id
      })
      expect(streamWithRole?.role).to.be.not.ok
    })

    it('Should not revoke owner permissions', async () => {
      await revokePermissionsStream({ streamId: testStream.id, userId: userOne.id })
        .then(() => {
          throw new Error('This should have thrown')
        })
        .catch((err) => {
          expect(err.message).to.include('cannot revoke permissions.')
        })
    })

    it('Collaborator can leave a stream on his own', async () => {
      const streamId = await createStream({
        name: 'test streammmmm',
        description: 'ayy',
        isPublic: false,
        ownerId: userOne.id
      })
      await addOrUpdateStreamCollaborator(
        streamId,
        userTwo.id,
        Roles.Stream.Reviewer,
        userOne.id
      )

      const apollo = await buildAuthenticatedApolloServer(userTwo.id)
      const { data, errors } = await leaveStream(apollo, { streamId })

      expect(errors).to.be.not.ok
      expect(data?.streamLeave).to.be.ok

      const userIsCollaborator = await isStreamCollaborator(userTwo.id, streamId)
      expect(userIsCollaborator).to.not.be.ok
    })
  })

  describe('`UpdatedAt` prop update', () => {
    let updatableStream: StreamWithOptionalRole

    before(async () => {
      const id = await createStream({
        name: 'T1',
        ownerId: userOne.id,
        isPublic: false
      })
      const newStream = await getStream({ streamId: id })
      if (!newStream) throw new Error("Couldn't create stream")

      updatableStream = newStream
    })

    afterEach(async () => {
      // refresh updatedAt
      const stream = await getStream({ streamId: updatableStream.id })
      if (!stream) throw new Error("Couldn't create stream")
      updatableStream = stream
    })

    it('Should update stream updatedAt on stream update ', async () => {
      await updateStream({ id: updatableStream.id, name: 'TU1' })
      const su = await getStream({ streamId: updatableStream.id })

      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(updatableStream.updatedAt)
    })

    it('Should update stream updatedAt on sharing operations ', async () => {
      let lastUpdatedAt = updatableStream.updatedAt

      await grantPermissionsStream({
        streamId: updatableStream.id,
        userId: userTwo.id,
        role: 'stream:contributor'
      })

      // await sleep(100)
      let su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
      lastUpdatedAt = su!.updatedAt

      await revokePermissionsStream({
        streamId: updatableStream.id,
        userId: userTwo.id
      })

      // await sleep(100)

      su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
    })

    it('Should update stream updatedAt on branch operations ', async () => {
      let lastUpdatedAt = updatableStream.updatedAt

      await createBranch({
        name: 'dim/lol',
        streamId: updatableStream.id,
        authorId: userOne.id,
        description: 'ayyyy'
      })

      const su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
      lastUpdatedAt = su!.updatedAt

      // await sleep(100)

      const b = await getBranchByNameAndStreamId({
        streamId: updatableStream.id,
        name: 'dim/lol'
      })
      await deleteBranchById({ id: b!.id, streamId: updatableStream.id })

      const su2 = await getStream({ streamId: updatableStream.id })
      expect(su2?.updatedAt).to.be.ok
      expect(su2!.updatedAt).to.not.equal(lastUpdatedAt)
    })

    it('Should update stream updatedAt on commit operations ', async () => {
      const testObject = { foo: 'bar', baz: 'qux', id: '' }
      testObject.id = await createObject(updatableStream.id, testObject)

      await createCommitByBranchName({
        streamId: updatableStream.id,
        branchName: 'main',
        message: 'first commit',
        objectId: testObject.id,
        authorId: userOne.id,
        sourceApplication: 'tests',
        totalChildrenCount: null,
        parents: null
      })

      const su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(updatableStream.updatedAt)
    })
  })

  describe('when reading streams', () => {
    const PAGE_LIMIT = 5

    // keep owned+shared below maximum limit (50)
    const OWNED_STREAM_COUNT = 30
    const SHARED_STREAM_COUNT = 6
    const TOTAL_OWN_STREAM_COUNT = OWNED_STREAM_COUNT + SHARED_STREAM_COUNT

    const PUBLIC_STREAM_COUNT = 15
    const DISCOVERABLE_STREAM_COUNT = PUBLIC_STREAM_COUNT - 5

    let userOneStreams: BasicTestStream[]
    let userTwoStreams: BasicTestStream[]

    before(async () => {
      // truncating previous streams
      await truncateTables([Streams.name])

      async function setupStreams(user: BasicTestUser): Promise<BasicTestStream[]> {
        let remainingPublicStreams = PUBLIC_STREAM_COUNT
        let remainingDiscoverableStreams = DISCOVERABLE_STREAM_COUNT

        // creating test streams
        const streamDefinitions = times(
          OWNED_STREAM_COUNT,
          (i): BasicTestStream => ({
            name: `${user.name} test stream #${i}`,
            isPublic: remainingPublicStreams-- > 0,
            isDiscoverable: remainingDiscoverableStreams-- > 0,
            id: '',
            ownerId: ''
          })
        )

        // invoking promises sequentially to ensure timestamps differ
        for (const streamDef of streamDefinitions) {
          await createTestStream(streamDef, user)
          await sleep(1)
        }

        return streamDefinitions
      }

      async function shareStreams(
        streams: BasicTestStream[],
        streamOwner: BasicTestUser,
        targetUser: BasicTestUser
      ) {
        // invoking promises sequentially to ensure timestamps differ between items
        for (let i = 0; i < SHARED_STREAM_COUNT; i++) {
          await addOrUpdateStreamCollaborator(
            streams[i].id,
            targetUser.id,
            Roles.Stream.Contributor,
            streamOwner.id
          )
          await sleep(1)
        }
      }

      // creating test streams
      userOneStreams = await setupStreams(userOne)
      userTwoStreams = await setupStreams(userTwo)

      // share streams
      await shareStreams(userOneStreams, userOne, userTwo)
      await shareStreams(userTwoStreams, userTwo, userOne)
    })

    const paginationDataset = [
      { display: 'with pagination', pagination: true },
      { display: 'without pagination', pagination: false }
    ]

    const isLimitedUserStreams = (
      data: GetLimitedUserStreamsQuery | GetUserStreamsQuery
    ): data is GetLimitedUserStreamsQuery => has(data, 'otherUser')

    /**
     * Base test for testing paginated & unpaginated User.streams query in various circumstances
     */
    const testPaginatedUserStreams = async (
      apollo: ApolloServer,
      pagination: boolean,
      userId: string,
      isOtherUser: boolean,
      options: Partial<{ limitedUserQuery: boolean }> = {}
    ) => {
      const { limitedUserQuery } = options
      const expectedTotalCount = isOtherUser
        ? SHARED_STREAM_COUNT + DISCOVERABLE_STREAM_COUNT // only shared streams + discoverable ones
        : TOTAL_OWN_STREAM_COUNT // all owned & shared streams

      const requestPage = async (cursor?: Nullable<string>) => {
        const vars = {
          userId,
          limit: pagination ? PAGE_LIMIT : 100,
          cursor
        }
        const results = limitedUserQuery
          ? await getLimitedUserStreams(apollo, vars)
          : await getUserStreams(apollo, vars)

        expect(results).to.not.haveGraphQLErrors()
        if (!results.data) throw new Error('Unexpected issue')

        let streams: Get<GetUserStreamsQuery, 'user.streams'>
        if (isLimitedUserStreams(results.data)) {
          streams = results.data.otherUser?.streams
        } else {
          streams = results.data.user?.streams
        }

        if (!streams) throw new Error('Unexpected issue')
        expect(streams.totalCount).to.eq(expectedTotalCount)
        return streams
      }

      let cursor: Nullable<string> = null
      let failSafe = Math.ceil(TOTAL_OWN_STREAM_COUNT / PAGE_LIMIT)
      let allItemsFound = false
      let foundItemsCount = 0
      let foundOwnedStreams = 0
      let foundSharedStreams = 0

      let previousUpdatedAt: Nullable<Dayjs> = null
      do {
        const pageStreams: Awaited<ReturnType<typeof requestPage>> = await requestPage(
          cursor
        )

        cursor = pageStreams.cursor || null
        foundItemsCount += pageStreams.items?.length || 0

        if (!pageStreams.items?.length) {
          allItemsFound = true
          break
        }

        for (const item of pageStreams.items || []) {
          expect(item.id).to.be.ok
          expect(item.role).to.be.ok
          expect(item.createdAt).to.be.ok
          expect(item.updatedAt).to.be.ok

          const newUpdatedAt = dayjs(item.updatedAt)
          if (previousUpdatedAt) {
            const isSortingCorrect = previousUpdatedAt.isAfter(newUpdatedAt)
            expect(isSortingCorrect).to.be.true
          }
          previousUpdatedAt = newUpdatedAt

          if (item.role === Roles.Stream.Owner) {
            foundOwnedStreams++
          } else {
            foundSharedStreams++
          }
        }
      } while (failSafe-- > 0)

      expect(allItemsFound).to.be.true
      expect(foundItemsCount).to.eq(expectedTotalCount)
      expect(foundOwnedStreams).to.eq(
        isOtherUser
          ? DISCOVERABLE_STREAM_COUNT // only discoverable streams found, those user will be an owner in (see before())
          : OWNED_STREAM_COUNT // all streams where user is a contributor
      )
      expect(foundSharedStreams).to.eq(SHARED_STREAM_COUNT)
    }

    describe('and user is authenticated', () => {
      let apollo: ApolloServer
      let activeUserId: string

      before(async () => {
        activeUserId = userOne.id
        apollo = await buildAuthenticatedApolloServer(activeUserId)
      })

      paginationDataset.forEach(({ display, pagination }) => {
        it(`User.streams() ${display} for active user returns all streams the user is a collaborator on`, async () => {
          await testPaginatedUserStreams(apollo, pagination, activeUserId, false)
        })

        userLimitedUserDataSet.forEach(({ limitedUser }) => {
          const prefix = limitedUser
            ? 'LimitedUser.streams()'
            : 'User.streams() for a different user'

          it(`${prefix} ${display} returns that users discoverable streams`, async () => {
            await testPaginatedUserStreams(apollo, pagination, userTwo.id, true, {
              limitedUserQuery: limitedUser
            })
          })
        })
      })
    })

    describe('and user is not authenticated', () => {
      let apollo: ApolloServer

      before(async () => {
        apollo = await buildUnauthenticatedApolloServer()
      })

      userLimitedUserDataSet.forEach(({ display, limitedUser }) => {
        it(`${display}.streams is inaccessible`, async () => {
          const results = limitedUser
            ? await getLimitedUserStreams(apollo, { userId: userOne.id })
            : await getUserStreams(apollo, { userId: userOne.id })
          expect(results).to.haveGraphQLErrors()
          expect(results.data?.otherUser || results.data?.user).to.be.not.ok
        })
      })
    })
  })
})
