import { before, describe } from 'mocha'
import { expect } from 'chai'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { beforeEachContext } from '@/test/hooks'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import {
  CreateProjectDocument,
  GetProjectObjectDocument,
  ProjectCreateInput
} from '@/test/graphql/generated/graphql'
import { createTestObject } from '@/test/speckle-helpers/commitHelper'

describe('Projects', () => {
  const me: BasicTestUser = {
    name: 'hello itsa me',
    email: '',
    id: ''
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me])
  })

  describe('in GraphQL API', () => {
    let apollo: TestApolloServer

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
    })

    it('can be created', async () => {
      const input: ProjectCreateInput = {
        name: 'my first project',
        description: 'ayyooo'
      }
      const res = await apollo.execute(CreateProjectDocument, {
        input
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.projectMutations.create.id).to.be.ok
      expect(res.data?.projectMutations.create.name).to.equal(input.name)
      expect(res.data?.projectMutations.create.description).to.equal(input.description)
    })

    describe('after creation', () => {
      const myStream: BasicTestStream = {
        name: 'this is my great stream #1',
        isPublic: true,
        ownerId: '',
        id: ''
      }

      const getMyStreamObject = async (objectId: string) =>
        await apollo.execute(GetProjectObjectDocument, {
          projectId: myStream.id,
          objectId
        })

      before(async () => {
        await createTestStreams([[myStream, me]])
      })

      it('returns null if querying for a non-existant object()', async () => {
        const res = await getMyStreamObject('non-existant-object-id')

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.project.object).to.be.null
      })

      it('can have their objects retrieved through object()', async () => {
        const objectId = await createTestObject({ projectId: myStream.id })
        const res = await getMyStreamObject(objectId)

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.project.object?.id).to.equal(objectId)
      })
    })
  })
})
