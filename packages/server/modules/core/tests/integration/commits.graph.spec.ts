import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'

import { db } from '@/db/knex'
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateWorkspaceDocument,
  CreateWorkspaceProjectDocument
} from '@/modules/core/graph/generated/graphql'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'
import gql from 'graphql-tag'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { createTestUser } from '@/test/authHelper'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

const createCommitMutation = gql`
  mutation CreateCommit($commit: CommitCreateInput!) {
    commitCreate(commit: $commit)
  }
`
describe('Commits graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })

  describe('Create commit mutation', () => {
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
          .update({ status: 'canceled' })
          .where({ workspaceId: workspace!.id })

        const versionCreateRes = await apollo.execute(createCommitMutation, {
          commit: {
            streamId: project!.id,
            branchName: 'branch',
            objectId: 'objectid'
          }
        })
        expect(versionCreateRes).to.haveGraphQLErrors()
        expect(versionCreateRes.errors).to.have.length(1)
        expect(versionCreateRes.errors![0].message).to.eq(
          new WorkspaceReadOnlyError().message
        )
      }
    )
  })
})
