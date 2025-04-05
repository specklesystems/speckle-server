import { db } from '@/db/knex'
import { createRandomString } from '@/modules/core/helpers/testHelpers'
import {
  getWorkspacePlansByWorkspaceIdFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { createTestUser } from '@/test/authHelper'
import { PaidWorkspacePlans, PaidWorkspacePlanStatuses } from '@speckle/shared'
import { expect } from 'chai'

describe('Module @gatekeeper', () => {
  const upsertWorkspacePlan = upsertWorkspacePlanFactory({ db })
  describe('Repositories WorkspacePlan', () => {
    describe('getWorkspacePlansByWorkspaceIdFactory should return a function that, ', () => {
      const getWorkspacePlansByWorkspaceId = getWorkspacePlansByWorkspaceIdFactory({
        db
      })
      it('should return a map of workspacePlans by their workspaceId', async () => {
        const now = new Date()
        const user = await createTestUser()
        const workspace1 = {
          id: '',
          name: createRandomString(),
          ownerId: user.id
        }
        await createTestWorkspace(workspace1, user)
        const plan1 = {
          workspaceId: workspace1.id,
          name: PaidWorkspacePlans.Team,
          createdAt: now,
          status: PaidWorkspacePlanStatuses.Valid
        }
        await upsertWorkspacePlan({
          workspacePlan: plan1
        })
        const workspace2 = {
          id: '',
          name: createRandomString(),
          ownerId: user.id
        }
        await createTestWorkspace(workspace2, user)
        const plan2 = {
          workspaceId: workspace2.id,
          name: PaidWorkspacePlans.Team,
          createdAt: now,
          status: PaidWorkspacePlanStatuses.Valid
        }
        await upsertWorkspacePlan({
          workspacePlan: plan2
        })

        const results = await getWorkspacePlansByWorkspaceId({
          workspaceIds: [workspace1.id, workspace2.id]
        })

        for (const [workspaceId, workspacePlan] of Object.entries(results)) {
          const { createdAt, ...plan } = workspacePlan
          expect(createdAt).to.not.eq(null)
          expect(plan.workspaceId).to.eq(workspaceId)
          expect(plan).to.deep.eq(plan)
        }
      })
    })
  })
})
