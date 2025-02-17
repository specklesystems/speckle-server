import { buildApolloServer } from '@/app'
import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { Commits, Streams, Users } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { publish } from '@/modules/shared/utils/subscriptions'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { readOtherUsersCommits, readOwnCommits } from '@/test/graphql/commits'
import { createAuthedTestContext, ServerAndContext } from '@/test/graphqlHelper'
import { truncateTables } from '@/test/hooks'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'

const getUser = getUserFactory({ db })
const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
})

describe('Commits (GraphQL)', () => {
  const readableUserCommitsCount = 15
  let readablePublicUserCommitsCount = 0

  const me: BasicTestUser = {
    id: '',
    email: '',
    name: 'its a meeeee',
    bio: 'ayyy',
    company: 'ayyy inc'
  }

  const otherGuy: BasicTestUser = {
    id: '',
    email: '',
    name: 'its an other guyyyyy',
    bio: 'fffoooo',
    company: 'fooooo inc'
  }

  const myStream: BasicTestStream = {
    id: '',
    name: 'my stream 1',
    isPublic: true,
    ownerId: ''
  }

  const myPrivateStream: BasicTestStream = {
    id: '',
    name: 'my private stream 1',
    isPublic: false,
    ownerId: ''
  }

  before(async () => {
    await truncateTables([Users.name, Commits.name, Streams.name])
    await createTestUsers([me, otherGuy])
    await createTestStreams([
      [myStream, me],
      [myPrivateStream, me]
    ])

    await Promise.all([
      addOrUpdateStreamCollaborator(
        myStream.id,
        otherGuy.id,
        Roles.Stream.Contributor,
        me.id
      ),
      addOrUpdateStreamCollaborator(
        myPrivateStream.id,
        otherGuy.id,
        Roles.Stream.Contributor,
        me.id
      )
    ])

    // creating commits sequentially so that we don't get duplicate cursor issues
    for (let i = 0; i < readableUserCommitsCount; i++) {
      const usePrivateStream = i % 2 === 0 ? myStream.id : myPrivateStream.id
      if (usePrivateStream) {
        readablePublicUserCommitsCount++
      }

      // my commit
      await createTestCommit({
        id: '',
        objectId: '',
        streamId: usePrivateStream ? myStream.id : myPrivateStream.id,
        authorId: me.id
      })

      // other guys commit
      await createTestCommit({
        id: '',
        objectId: '',
        streamId: usePrivateStream ? myStream.id : myPrivateStream.id,
        authorId: otherGuy.id
      })
    }
  })

  describe('when user authenticated', async () => {
    let apollo: ServerAndContext

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }
    })

    describe('and reading user commits', async () => {
      it('can read own public and private commits', async () => {
        const readOwnCommitsPage = async (cursor: Nullable<string>, limit = 5) => {
          const results = await readOwnCommits(apollo, { cursor, limit })

          expect(results).to.not.haveGraphQLErrors()
          expect(results.data?.activeUser?.commits?.totalCount).to.eq(
            readableUserCommitsCount
          )
          expect(results.data?.activeUser?.commits?.cursor).to.be.ok

          expect(
            results.data?.activeUser?.commits?.items || []
          ).to.have.lengthOf.lessThanOrEqual(limit)

          const commits = results.data!.activeUser!.commits!.items!
          const returnedCommitCount = commits.length

          for (const commit of commits) {
            expect(commit.id).to.be.ok
            expect(commit.authorId).to.eq(me.id)
            expect(commit.authorName).to.eq(me.name)
            expect(commit.streamId).to.eq(myStream.id)
            expect(commit.streamName).to.eq(myStream.name)
          }

          const newCursor = results.data!.activeUser!.commits!.cursor!
          const totalCount = results.data!.activeUser!.commits!.totalCount

          return { newCursor, returnedCommitCount, totalCount }
        }

        const limit = 5
        const { newCursor, returnedCommitCount, totalCount } = await readOwnCommitsPage(
          null,
          limit
        )

        let readCommitsCount = returnedCommitCount
        const remainingPages = Math.ceil((totalCount - returnedCommitCount) / limit)
        for (let p = 0; p < remainingPages; p++) {
          const { returnedCommitCount } = await readOwnCommitsPage(newCursor, limit)
          readCommitsCount += returnedCommitCount
        }

        expect(readCommitsCount).to.eq(totalCount)
      })

      it('can read other users public commits', async () => {
        const readOtherUsersCommitsPage = async (
          userId: string,
          cursor: Nullable<string>,
          limit = 5
        ) => {
          const results = await readOtherUsersCommits(apollo, { userId, cursor, limit })

          expect(results).to.not.haveGraphQLErrors()
          expect(results.data?.otherUser?.commits?.totalCount).to.eq(
            readablePublicUserCommitsCount
          )
          expect(results.data?.otherUser?.commits?.cursor).to.be.ok

          expect(
            results.data?.otherUser?.commits?.items || []
          ).to.have.lengthOf.lessThanOrEqual(limit)

          const commits = results.data!.otherUser!.commits!.items!
          const returnedCommitCount = commits.length

          for (const commit of commits) {
            expect(commit.id).to.be.ok
            expect(commit.authorId).to.eq(otherGuy.id)
            expect(commit.authorName).to.eq(otherGuy.name)
            expect(commit.streamId).to.eq(myStream.id)
            expect(commit.streamName).to.eq(myStream.name)

            expect(commit.stream.id).to.eq(myStream.id)
            expect(commit.stream.name).to.eq(myStream.name)
            expect(commit.stream.isPublic).to.be.true
          }

          const newCursor = results.data!.otherUser!.commits!.cursor!
          const totalCount = results.data!.otherUser!.commits!.totalCount

          return { newCursor, returnedCommitCount, totalCount }
        }

        const limit = 5
        const { newCursor, returnedCommitCount, totalCount } =
          await readOtherUsersCommitsPage(otherGuy.id, null, limit)

        let readCommitsCount = returnedCommitCount
        const remainingPages = Math.ceil((totalCount - returnedCommitCount) / limit)
        for (let p = 0; p < remainingPages; p++) {
          const { returnedCommitCount } = await readOtherUsersCommitsPage(
            otherGuy.id,
            newCursor,
            limit
          )
          readCommitsCount += returnedCommitCount
        }

        expect(readCommitsCount).to.eq(totalCount)
      })
    })
  })
})
