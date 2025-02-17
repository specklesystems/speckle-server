import { buildApolloServer } from '@/app'
import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { Commits, Streams, Users } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getCommitsFactory } from '@/modules/core/repositories/commits'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { publish } from '@/modules/shared/utils/subscriptions'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { deleteCommits, moveCommits } from '@/test/graphql/commits'
import {
  createAuthedTestContext,
  createTestContext,
  ServerAndContext
} from '@/test/graphqlHelper'
import { truncateTables } from '@/test/hooks'
import { BasicTestCommit, createTestCommits } from '@/test/speckle-helpers/commitHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import { times } from 'lodash'
import { describe } from 'mocha'

enum BatchActionType {
  Move,
  Delete
}

const getUser = getUserFactory({ db })
const createBranch = createBranchFactory({ db })
const getCommits = getCommitsFactory({ db })
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

const cleanup = async () => {
  await truncateTables([Streams.name, Users.name, Commits.name])
}

describe('Batch commits', () => {
  const userCommmitCount = 10

  const secondBranchName = 'second'

  const me: BasicTestUser = {
    name: 'batch commit dude',
    email: 'batchcommitguy@gmail.com',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'other batch commit guy',
    email: 'otherbatchcommitguy@gmail.com',
    id: ''
  }

  const myStream: BasicTestStream = {
    name: 'my first test stream',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  const otherStream: BasicTestStream = {
    name: 'other guys first test stream',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  let myCommits: BasicTestCommit[]

  let otherCommits: BasicTestCommit[]

  let streamId: string

  before(async () => {
    await cleanup()
    await createTestUsers([me, otherGuy])
    await createTestStreams([
      [myStream, me],
      [otherStream, otherGuy]
    ])

    await Promise.all([
      // create another branch for each stream
      createBranch({
        name: secondBranchName,
        description: '',
        streamId: myStream.id,
        authorId: me.id
      }),
      createBranch({
        name: secondBranchName,
        description: '',
        streamId: otherStream.id,
        authorId: otherGuy.id
      }),
      // add users as contributors to each others streams
      addOrUpdateStreamCollaborator(
        otherStream.id,
        me.id,
        Roles.Stream.Contributor,
        otherGuy.id
      )
    ])

    myCommits = times(userCommmitCount, (i): BasicTestCommit => {
      streamId = i % 2 === 0 ? myStream.id : otherStream.id
      return {
        id: '',
        objectId: '',
        streamId,
        authorId: me.id
      }
    })
    otherCommits = times(
      userCommmitCount,
      (): BasicTestCommit => ({
        id: '',
        objectId: '',
        streamId: otherStream.id,
        authorId: otherGuy.id
      })
    )

    await createTestCommits([...myCommits, ...otherCommits])
  })

  const batchActionDataSet = [
    { display: 'move', type: BatchActionType.Move },
    { display: 'delete', type: BatchActionType.Delete }
  ]

  const buildBatchActionInvoker =
    (apollo: ServerAndContext) => (type: BatchActionType, commitIds: string[]) => {
      if (type === BatchActionType.Delete) {
        return deleteCommits(apollo, { input: { commitIds, streamId } })
      } else if (type === BatchActionType.Move) {
        return moveCommits(apollo, {
          input: { commitIds, targetBranch: secondBranchName, streamId }
        })
      } else {
        throw new Error('Unexpected batch action type')
      }
    }

  type BatchActionInvoker = ReturnType<typeof buildBatchActionInvoker>

  describe('when authenticated', () => {
    let apollo: ServerAndContext
    let invokeBatchAction: BatchActionInvoker

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }
      invokeBatchAction = buildBatchActionInvoker(apollo)
    })

    batchActionDataSet.forEach(({ display, type }) => {
      it(`can't batch ${display} commits if not commit or stream author`, async () => {
        const result = await invokeBatchAction(
          type,
          otherCommits.map((c) => c.id)
        )

        expect(result).to.haveGraphQLErrors('you must either own them or their streams')
      })

      it(`can't batch ${display} an empty commit array`, async () => {
        const result = await invokeBatchAction(type, [])

        expect(result).to.haveGraphQLErrors('No commits specified')
      })

      it(`can't batch ${display} commits if at least one is nonexistant`, async () => {
        const result = await invokeBatchAction(type, [
          ...myCommits.map((c) => c.id),
          'aaaaaaaa'
        ])

        expect(result).to.haveGraphQLErrors('one of the commits does not exist')
      })
    })

    describe('and deleting commits', async () => {
      const deletableCommitCount = 5

      let myDeletableCommits: BasicTestCommit[]

      beforeEach(async () => {
        myDeletableCommits = times(deletableCommitCount, (i): BasicTestCommit => {
          streamId = i % 2 === 0 ? myStream.id : otherStream.id
          return {
            id: '',
            streamId,
            objectId: '',
            authorId: me.id
          }
        })

        await createTestCommits(myDeletableCommits)
      })

      const invokeDelete = (commitIds: string[]) =>
        deleteCommits(apollo, { input: { commitIds, streamId } })

      const validateDeleted = async (commitIds: string[]) => {
        const commits = await getCommits(commitIds)
        expect(commits).to.be.empty
      }

      it('can do it for commits of multiple streams', async () => {
        const commitIds = myDeletableCommits.map((c) => c.id)
        const result = await invokeDelete(commitIds)

        expect(result).to.not.haveGraphQLErrors()
        await validateDeleted(commitIds)
      })
    })

    describe('and moving commits', async () => {
      const movableCommitCount = 5

      let myMovableCommits: BasicTestCommit[]
      let streamId: string

      before(async () => {
        myMovableCommits = times(movableCommitCount, (i): BasicTestCommit => {
          streamId = i % 2 === 0 ? myStream.id : otherStream.id
          return {
            id: '',
            objectId: '',
            streamId,
            authorId: me.id
          }
        })

        await createTestCommits(myMovableCommits)
      })

      const invokeMove = (commitIds: string[], targetBranch = secondBranchName) =>
        moveCommits(apollo, { input: { commitIds, targetBranch, streamId } })
      const validateMoved = async (
        commitIds: string[],
        targetBranch = secondBranchName
      ) => {
        const commits = await getCommits(commitIds)
        const areAllMoved =
          commits.length === commitIds.length &&
          commits.every((c) => c.branchName === targetBranch)
        expect(areAllMoved).to.be.true
      }

      it("can't do it for commits belonging to multiple streams", async () => {
        const commitIds = myMovableCommits.map((c) => c.id)
        const result = await invokeMove(commitIds)

        expect(result).to.haveGraphQLErrors('commits belong to different streams')
      })

      it('moves to new branch when specifying a nonexistant target branch', async () => {
        const newBranchName = 'some-nonexistant-stream'
        const commitIds = myMovableCommits
          .filter((c) => c.streamId === myStream.id)
          .map((c) => c.id)
        const result = await invokeMove(commitIds, newBranchName)

        expect(result).to.not.haveGraphQLErrors()
        await validateMoved(commitIds, newBranchName)
      })

      it('can do it with commits belonging to the same stream', async () => {
        const commitIds = myMovableCommits
          .filter((c) => c.streamId === myStream.id)
          .map((c) => c.id)
        const result = await invokeMove(commitIds)

        expect(result).to.not.haveGraphQLErrors()
        await validateMoved(commitIds)
      })
    })
  })

  describe('when not authenticated', () => {
    let apollo: ServerAndContext
    let invokeBatchAction: BatchActionInvoker

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createTestContext()
      }
      invokeBatchAction = buildBatchActionInvoker(apollo)
    })

    batchActionDataSet.forEach(({ display, type }) => {
      it(`can't batch ${display} commits`, async () => {
        const result = await invokeBatchAction(
          type,
          myCommits.map((c) => c.id)
        )

        expect(result).to.haveGraphQLErrors(
          'Your auth token does not have the required scope'
        )
      })
    })
  })
})
