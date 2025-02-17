import { before, describe } from 'mocha'
import { expect } from 'chai'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { beforeEachContext } from '@/test/hooks'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import {
  BatchDeleteProjectsDocument,
  CreateProjectDocument,
  GetProjectObjectDocument,
  ProjectCreateInput
} from '@/test/graphql/generated/graphql'
import { createTestObject } from '@/test/speckle-helpers/commitHelper'
import { times } from 'lodash'
import { Roles } from '@speckle/shared'

describe('Projects', () => {
  const me: BasicTestUser = {
    name: 'hello itsa me',
    email: '',
    id: ''
  }

  const otherUser: BasicTestUser = {
    name: 'hello itsa some otha guy',
    email: '',
    id: ''
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me, otherUser])
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

    describe('when doing batch deletion', () => {
      const createOtherGuyProjectBatch = async () => {
        const projects: BasicTestStream[] = times(3, () => ({
          id: '',
          ownerId: otherUser.id,
          name: `project ${Math.random()}`,
          isPublic: false
        }))

        await createTestStreams(projects.map((p) => [p, me]))
        return projects.map((p) => p.id)
      }

      const batchDeleteProjects = async (ids: string[], asAdmin?: boolean) =>
        await apollo.execute(
          BatchDeleteProjectsDocument,
          { ids },
          {
            context: asAdmin
              ? { role: Roles.Server.Admin }
              : { role: Roles.Server.User }
          }
        )

      it("it doesn't work if user is not an admin", async () => {
        const projectIds = await createOtherGuyProjectBatch()
        const res = await batchDeleteProjects(projectIds)

        expect(res.data).to.not.be.ok
        expect(res).to.haveGraphQLErrors('You do not have the required server role')
      })

      it('works if user is an admin, even for not owned projects', async () => {
        const projectIds = await createOtherGuyProjectBatch()
        const res = await batchDeleteProjects(projectIds, true)

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations.batchDelete).to.be.true
      })
    })
  })
})
