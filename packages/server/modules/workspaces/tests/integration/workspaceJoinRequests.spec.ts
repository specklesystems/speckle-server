import { db } from '@/db/knex'
import { createRandomString } from '@/modules/core/helpers/testHelpers'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { updateWorkspaceJoinRequestStatusFactory } from '@/modules/workspaces/repositories/workspaceJoinRequests'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { dismissWorkspaceJoinRequestFactory } from '@/modules/workspaces/services/workspaceJoinRequests'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { WorkspaceJoinRequests } from '@/modules/workspacesCore/helpers/db'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
  'workspaceJoinRequests services',
  () => {
    describe('dismissWorkspaceJoinRequestFactory, returns a function that ', () => {
      it('throws an error if the workspace does not exists', async () => {
        const err = await expectToThrow(() =>
          dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })({ workspaceId: createRandomString(), userId: createRandomString() })
        )
        expect(err.message).to.equal(WorkspaceNotFoundError.defaultMessage)
      })
      it('creates the request with the dismissed status', async () => {
        const user: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: 'john-speckle@example.org',
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(user)

        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, user)

        expect(
          await dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })({ workspaceId: workspace.id, userId: user.id })
        ).to.equal(true)

        expect(
          await db(WorkspaceJoinRequests.name)
            .where({ workspaceId: workspace.id, userId: user.id })
            .select('status')
            .first()
        ).to.deep.equal({ status: 'dismissed' })
      })
    })
  }
)
