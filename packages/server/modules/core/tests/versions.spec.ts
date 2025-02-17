import { ActionTypes } from '@/modules/activitystream/helpers/types'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateProjectVersionDocument,
  CreateVersionInput,
  MarkProjectVersionReceivedDocument,
  MarkReceivedVersionInput
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { getStreamActivities } from '@/test/speckle-helpers/activityStreamHelper'
import {
  BasicTestBranch,
  createTestBranches
} from '@/test/speckle-helpers/branchHelper'
import { createTestObject } from '@/test/speckle-helpers/commitHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import { omit } from 'lodash'
import { before, describe } from 'mocha'

describe('Versions', () => {
  const me: BasicTestUser = {
    name: 'hello itsa me',
    email: '',
    id: ''
  }

  const myPrivateStream: BasicTestStream = {
    name: 'this is my private stream #1',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  const myBranch: BasicTestBranch = {
    name: 'my branchy #1',
    streamId: '',
    id: '',
    authorId: ''
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me])
    await createTestStreams([[myPrivateStream, me]])
    await createTestBranches([{ branch: myBranch, stream: myPrivateStream, owner: me }])
  })

  describe('in GraphQL API', () => {
    let apollo: TestApolloServer
    let objectId: string

    const createVersion = async (input: CreateVersionInput) =>
      await apollo.execute(CreateProjectVersionDocument, { input })

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
      objectId = await createTestObject({ projectId: myPrivateStream.id })
    })

    it('can be created', async () => {
      const input: CreateVersionInput = {
        projectId: myPrivateStream.id,
        modelId: myBranch.id,
        objectId,
        message: 'Yoooo!',
        sourceApplication: 'tests',
        parents: []
      }
      const res = await createVersion(input)

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.versionMutations.create.id).to.be.ok
      expect(res.data?.versionMutations.create.message).to.eq(input.message)
      expect(res.data?.versionMutations.create.sourceApplication).to.eq(
        input.sourceApplication
      )
      expect(res.data?.versionMutations.create.model.id).to.eq(myBranch.id)
      expect(res.data?.versionMutations.create.referencedObject).to.eq(objectId)
    })

    describe('after creation', () => {
      let firstVersion: CreateVersionInput & { id: string }

      before(async () => {
        firstVersion = {
          projectId: myPrivateStream.id,
          modelId: myBranch.id,
          objectId,
          message: 'welcome #1',
          sourceApplication: 'testsz',
          parents: [],
          id: ''
        }
        const res = await createVersion(omit(firstVersion, ['id']))
        firstVersion.id = res.data!.versionMutations.create.id
        expect(firstVersion.id).to.be.ok
      })

      it('can be marked as received', async () => {
        const input: MarkReceivedVersionInput = {
          versionId: firstVersion.id,
          projectId: myPrivateStream.id,
          sourceApplication: 'booo',
          message: 'hey hihihi'
        }
        const res = await apollo.execute(MarkProjectVersionReceivedDocument, {
          input
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.versionMutations.markReceived).to.be.true

        const activities = await getStreamActivities(myPrivateStream.id, {
          actionType: ActionTypes.Commit.Receive,
          userId: me.id
        })
        expect(activities).to.have.length(1)
        expect(activities[0].info?.message).to.eq(input.message)
      })
    })
  })
})
