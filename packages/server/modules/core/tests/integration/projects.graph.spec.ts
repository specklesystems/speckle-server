import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import {
  CreateProjectDocument,
  ProjectVisibility
} from '@/modules/core/graph/generated/graphql'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { expect } from 'chai'
import { beforeEachContext } from '@/test/hooks'
import type { TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_PERSONAL_PROJECTS_LIMITS_ENABLED } = getFeatureFlags()

;(FF_PERSONAL_PROJECTS_LIMITS_ENABLED ? describe.skip : describe)(
  'Projects GraphQL @core (outside of workspaces)',
  () => {
    let apollo: TestApolloServer
    const me: BasicTestUser = {
      id: '',
      name: 'me',
      email: '',
      role: Roles.Server.Admin
    }

    before(async () => {
      await beforeEachContext()
      await createTestUser(me)
      apollo = await testApolloServer({ authUserId: me.id })
    })

    describe('when being created', () => {
      it('should use private visibility by default ', async () => {
        const res = await apollo.execute(
          CreateProjectDocument,
          {
            input: {
              name: 'Test Default Visibility Project'
            }
          },
          { assertNoErrors: true }
        )

        const project = res.data?.projectMutations.create
        expect(project).to.be.ok
        expect(project?.visibility).to.eq(ProjectVisibility.Private)
      })
    })
  }
)
