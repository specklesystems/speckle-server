import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { db } from '@/db/knex'
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateObjectDocument,
  CreateWorkspaceDocument,
  CreateWorkspaceProjectDocument
} from '@/modules/core/graph/generated/graphql'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { PaidWorkspacePlanStatuses } from '@speckle/shared'
import { createTestUser } from '@/test/authHelper'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

describe('Objects graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })

  describe('objectCreate mutation', () => {
    ;(FF_BILLING_INTEGRATION_ENABLED ? it : it.skip)(
      'should return error if project is read-only',
      async () => {
        const { id: userId } = await createTestUser({
          name: 'emails user',
          email: createRandomEmail(),
          password: createRandomPassword()
        })

        const apollo = await testApolloServer({ authUserId: userId })

        const workspaceCreateRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: 'test ws' }
        })
        expect(workspaceCreateRes).to.not.haveGraphQLErrors()

        const workspace = workspaceCreateRes.data?.workspaceMutations.create

        const projectCreateRes = await apollo.execute(CreateWorkspaceProjectDocument, {
          input: { workspaceId: workspace!.id, name: 'test project' }
        })
        expect(projectCreateRes).to.not.haveGraphQLErrors()
        const project = projectCreateRes.data?.workspaceMutations.projects.create

        // Make the project read-only
        await db('workspace_plans')
          .update({ status: PaidWorkspacePlanStatuses.Canceled })
          .where({ workspaceId: workspace!.id })

        const objectCreateRes = await apollo.execute(CreateObjectDocument, {
          input: {
            streamId: project!.id,
            objects: [
              {
                id: 'e5262a6fb51540974e6d07ac60b7fe5c',
                name: 'Rhino Model',
                elements: [
                  {
                    referencedId: '581a822cdaa5c2972783510d57617f73',
                    /* eslint-disable camelcase */
                    speckle_type: 'reference'
                  }
                ],
                __closure: {
                  '0086c072ee1fd70ac0a68c067a37e0eb': 3
                },
                speckleType: 'Speckle.Core.Models.Collection',
                speckle_type: 'Speckle.Core.Models.Collection',
                applicationId: null,
                collectionType: 'rhino model',
                totalChildrenCount: 610
              }
            ]
          }
        })
        expect(objectCreateRes).to.haveGraphQLErrors()
        expect(objectCreateRes.errors).to.have.length(1)
        expect(objectCreateRes.errors![0].message).to.eq(
          new WorkspaceReadOnlyError().message
        )
      }
    )
  })
})
