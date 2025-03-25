import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserProjectsDocument,
  CreateProjectDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles, AllScopes } from '@/modules/core/helpers/mainConstants'
import { expect } from 'chai'
import { beforeEach } from 'mocha'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_NEW_PLANS_ENABLED } =
  getFeatureFlags()

FF_WORKSPACES_MODULE_ENABLED && FF_WORKSPACES_NEW_PLANS_ENABLED
  ? null
  : describe('Projects GraphQL @core', () => {
      let apollo: TestApolloServer

      const testAdminUser: BasicTestUser = {
        id: '',
        name: 'John Speckle',
        email: 'john-speckle@example.org',
        role: Roles.Server.Admin,
        verified: true
      }

      before(async () => {
        await createTestUsers([testAdminUser])
        const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
        apollo = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testAdminUser.id,
            token,
            role: testAdminUser.role,
            scopes: AllScopes
          })
        })
      })

      beforeEach(async () => {
        await beforeEachContext()
      })

      describe('query user.projects', () => {
        it('should return all user projects', async () => {
          const createProjectRes = await apollo.execute(CreateProjectDocument, {
            input: { name: 'project' }
          })
          expect(createProjectRes).to.not.haveGraphQLErrors()
          const userProject = createProjectRes.data?.projectMutations.create

          const userProjectsRes = await apollo.execute(ActiveUserProjectsDocument, {
            filter: { workspaceId: null }
          })
          expect(userProjectsRes).to.not.haveGraphQLErrors()
          const projects = userProjectsRes.data?.activeUser?.projects.items

          expect(projects).to.have.length(1)
          expect(projects?.at(0)?.id).to.eq(userProject?.id)
        })
      })
    })
