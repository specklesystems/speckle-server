import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateModelInput,
  CreateProjectModelDocument,
  FindProjectModelByNameDocument
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import { omit } from 'lodash'
import { before, describe } from 'mocha'

describe('Models', () => {
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

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me])
    await createTestStreams([[myPrivateStream, me]])
  })

  describe('in GraphQL API', () => {
    let apollo: TestApolloServer

    const createModel = async (input: CreateModelInput) =>
      await apollo.execute(CreateProjectModelDocument, {
        input
      })

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
    })

    it('can be created', async () => {
      const input: CreateModelInput = {
        projectId: myPrivateStream.id,
        name: 'my first model',
        description: 'ayyooo'
      }
      const res = await createModel(input)

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.modelMutations.create.id).to.be.ok
      expect(res.data?.modelMutations.create.name).to.equal(input.name)
      expect(res.data?.modelMutations.create.description).to.equal(input.description)
    })

    describe('after creation', () => {
      let firstModel: CreateModelInput & { id: string }

      before(async () => {
        firstModel = {
          projectId: myPrivateStream.id,
          name: 'anutha model #1',
          description: 'ayyooo!!',
          id: ''
        }
        const res = await createModel(omit(firstModel, ['id']))
        firstModel.id = res.data!.modelMutations.create.id
        expect(firstModel.id).to.be.ok
      })

      it('can be found by name', async () => {
        const res = await apollo.execute(FindProjectModelByNameDocument, {
          projectId: myPrivateStream.id,
          name: firstModel.name
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.project.modelByName.id).to.equal(firstModel.id)
        expect(res.data?.project.modelByName.name).to.equal(firstModel.name)
      })
    })
  })
})
