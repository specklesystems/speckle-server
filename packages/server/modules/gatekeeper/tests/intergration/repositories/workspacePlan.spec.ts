import { db } from '@/db/knex'
import {
  getWorkspacePlansByWorkspaceIdFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { WorkspacePlan } from '@speckle/shared'
import { PaidWorkspacePlans, PaidWorkspacePlanStatuses } from '@speckle/shared'
import { expect } from 'chai'
import { buildTestWorkspacePlan } from '@/modules/gatekeeper/tests/helpers/workspacePlan'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('Module @gatekeeper', () => {
  const upsertWorkspacePlan = upsertWorkspacePlanFactory({ db })
  const getWorkspacePlansByWorkspaceId = getWorkspacePlansByWorkspaceIdFactory({ db })

  ;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
    'Repositories WorkspacePlan',
    () => {
      let user: BasicTestUser
      let in5days: Date
      let workspace1: BasicTestWorkspace
      let workspace2: BasicTestWorkspace
      let workspaceWithoutPlan: BasicTestWorkspace
      let plan1: WorkspacePlan
      let plan2: WorkspacePlan

      before(async () => {
        user = await createTestUser()
        workspace1 = buildBasicTestWorkspace({ ownerId: user.id })
        workspace2 = buildBasicTestWorkspace({ ownerId: user.id })
        workspaceWithoutPlan = buildBasicTestWorkspace({ ownerId: user.id })
        await createTestWorkspace(workspace1, user)
        await createTestWorkspace(workspace2, user)
        await createTestWorkspace(workspaceWithoutPlan, user)

        plan1 = buildTestWorkspacePlan({ workspaceId: workspace1.id })
        plan2 = buildTestWorkspacePlan({ workspaceId: workspace2.id })

        await upsertWorkspacePlan({
          workspacePlan: plan1
        })

        await upsertWorkspacePlan({
          workspacePlan: plan2
        })
      })

      describe('getWorkspacePlansByWorkspaceIdFactory should return a function, that', () => {
        it('finds all workspacePlans by their workspaceId', async () => {
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

      describe('upsertWorkspacePlan should return a function, that', () => {
        it('inserts a workspace plan if it does not exist', async () => {
          await upsertWorkspacePlan({
            workspacePlan: buildTestWorkspacePlan({
              workspaceId: workspaceWithoutPlan.id
            })
          })

          const result = (
            await getWorkspacePlansByWorkspaceId({
              workspaceIds: [workspaceWithoutPlan.id]
            })
          )[workspaceWithoutPlan.id]
          expect(result.workspaceId).to.equal(workspaceWithoutPlan.id)
          expect(result.name).to.equal(PaidWorkspacePlans.Team)
          expect(result.status).to.equal(PaidWorkspacePlanStatuses.Valid)
        })

        it('updates the status, updatedAt and name in case it exist', async () => {
          in5days = new Date()
          in5days.setDate(in5days.getDate() + 7)

          await upsertWorkspacePlan({
            workspacePlan: buildTestWorkspacePlan({
              workspaceId: workspace2.id
            })
          })

          const result = (
            await getWorkspacePlansByWorkspaceId({
              workspaceIds: [workspace2.id]
            })
          )[workspace2.id]
          expect(result.workspaceId).to.equal(workspace2.id)
          expect(result.name).to.equal(PaidWorkspacePlans.ProUnlimited)
          expect(result.createdAt).to.be.lessThan(result.updatedAt)
          expect(result.updatedAt).to.be.deep.eq(in5days)
          expect(result.status).to.equal(PaidWorkspacePlanStatuses.Canceled)
        })
      })
    }
  )
})
