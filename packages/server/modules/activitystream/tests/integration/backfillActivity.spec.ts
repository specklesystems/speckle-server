import { db } from '@/db/knex'
import { buildTestProject } from '@/modules/core/tests/helpers/creation'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import {
  getUntrackedProjectRolesFactory,
  getUntrackedSubscriptionsFactory,
  getUntrackedWorkspacePlansFactory,
  getUntrackedWorkspaceSeatsFactory
} from '@/modules/activitystream/services/backfillActivity'
import { expect } from 'chai'
import { WorkspaceSeats } from '@/modules/workspacesCore/helpers/db'
import { WorkspaceSeat, WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { buildTestWorkspaceSubscription } from '@/modules/gatekeeper/tests/helpers/workspacePlan'
import { SubscriptionData } from '@/modules/gatekeeper/domain/billing'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { StreamAcl } from '@/modules/core/dbSchema'
import { Roles } from '@speckle/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('queries for activity backfill', () => {
  const LIMIT = 100
  const user = buildBasicTestUser()
  const secondUser = buildBasicTestUser()
  const workspace = buildBasicTestWorkspace()
  const project = buildTestProject()
  const subscription = buildTestWorkspaceSubscription({
    billingInterval: 'yearly',
    subscriptionData: {
      products: [
        {
          quantity: 1 // seat number needs to match
        }
      ]
    } as SubscriptionData
  })

  const saveActivity = saveActivityFactory({ db })
  const getUntrackedWorkspaceSeats = getUntrackedWorkspaceSeatsFactory({ db })
  const getUntrackedWorkspacePlans = getUntrackedWorkspacePlansFactory({ db })
  const getUntrackedSubscriptions = getUntrackedSubscriptionsFactory({ db })
  const getUntrackedProjectRoles = getUntrackedProjectRolesFactory({ db })

  before(async () => {
    await createTestUser(user)
    await createTestUser(secondUser)
    await createTestWorkspace(workspace, user, {
      addPlan: {
        name: 'free',
        status: 'valid'
      }
    })
    project.workspaceId = workspace.id
    subscription.workspaceId = workspace.id

    await createTestStream(project, user)
  })

  it('retrieves no project acl if activity is present', async () => {
    // activity entry was made by create project function as owner

    const plans = await getUntrackedProjectRoles(LIMIT)

    expect(plans).to.be.an('array').that.has.lengthOf(0)
  })

  it('retrieves project acls if activity is missing the role update', async () => {
    await db<StreamAclRecord>(StreamAcl.name)
      .where({ resourceId: project.id, userId: user.id })
      .update({
        role: Roles.Stream.Contributor
      })

    const plans = await getUntrackedProjectRoles(LIMIT)

    expect(plans).to.be.an('array').that.has.lengthOf(1)
  })
  ;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
    'workspace related backfill',
    () => {
      before(async () => {
        await db('workspace_subscriptions').insert(subscription)
        await saveActivity({
          userId: user.id,
          contextResourceType: 'workspace' as const,
          contextResourceId: workspace.id,
          eventType: 'workspace_subscription_updated' as const,
          payload: {
            version: '1' as const,
            new: {
              name: 'team',
              status: 'valid',
              totalEditorSeats: 1,
              billingInterval: 'yearly'
            },
            old: {
              name: 'free',
              status: 'valid'
            }
          }
        })
      })

      it('retrieves no seats if entry if activity is present', async () => {
        // activity entry was made by create function

        const seats = await getUntrackedWorkspaceSeats(LIMIT)

        expect(seats).to.be.an('array').that.has.lengthOf(0)
      })

      it('retrieves seats if activity entry is missing', async () => {
        await db<WorkspaceSeat>(WorkspaceSeats.name).where({ userId: user.id }).update({
          type: WorkspaceSeatType.Viewer
        })

        const seats = await getUntrackedWorkspaceSeats(LIMIT)

        expect(seats).to.be.an('array').that.has.lengthOf(1)
      })

      it('retrieves no plans if activity is present', async () => {
        // activity entry was made by create plan function

        const plans = await getUntrackedWorkspacePlans(LIMIT)

        expect(plans).to.be.an('array').that.has.lengthOf(0)
      })

      it('retrieves plans if activity entry is missing the plan name change', async () => {
        await db('workspace_plans').where({ workspaceId: workspace.id }).update({
          name: 'academia',
          status: 'valid'
        })

        const plans = await getUntrackedWorkspacePlans(LIMIT)

        expect(plans).to.be.an('array').that.has.lengthOf(1)
      })

      it('retrieves plans if activity entry is missing the plan status change', async () => {
        await db('workspace_plans').where({ workspaceId: workspace.id }).update({
          name: 'free',
          status: 'invalid'
        })

        const plans = await getUntrackedWorkspacePlans(LIMIT)

        expect(plans).to.be.an('array').that.has.lengthOf(1)
      })

      const setBaseCaseToTeamYearlyOneEditorWithActivity = async () => {
        await db<WorkspaceSeat>(WorkspaceSeats.name).where({ userId: user.id }).update({
          type: WorkspaceSeatType.Editor
        })
        await db('workspace_plans').where({ workspaceId: workspace.id }).update({
          name: 'team',
          status: 'valid'
        })

        await db('workspace_subscriptions')
          .where({ workspaceId: workspace.id })
          .update(subscription)
      }

      it('retrieves no subscriptions if activity is present', async () => {
        await setBaseCaseToTeamYearlyOneEditorWithActivity()

        const subscriptions = await getUntrackedSubscriptions(LIMIT)

        expect(subscriptions).to.be.an('array').that.has.lengthOf(0)
      })

      it('retrieves subscriptions if activity is missing plan name', async () => {
        await setBaseCaseToTeamYearlyOneEditorWithActivity()
        await db('workspace_plans').where({ workspaceId: workspace.id }).update({
          name: 'proUnlimited'
        })

        const subscriptions = await getUntrackedSubscriptions(LIMIT)

        expect(subscriptions).to.be.an('array').that.has.lengthOf(1)
      })

      it('retrieves subscriptions if activity is missing the status update', async () => {
        await setBaseCaseToTeamYearlyOneEditorWithActivity()
        await db('workspace_plans').where({ workspaceId: workspace.id }).update({
          status: 'paymentFailed'
        })

        const subscriptions = await getUntrackedSubscriptions(LIMIT)

        expect(subscriptions).to.be.an('array').that.has.lengthOf(1)
      })

      it('retrieves subscriptions if activity is missing the seat update', async () => {
        await setBaseCaseToTeamYearlyOneEditorWithActivity()
        await db('workspace_subscriptions')
          .where({ workspaceId: workspace.id })
          .update({
            subscriptionData: {
              products: [{ quantity: 2 }]
            }
          })

        const subscriptions = await getUntrackedSubscriptions(LIMIT)

        expect(subscriptions).to.be.an('array').that.has.lengthOf(1)
      })

      it('retrieves subscriptions if activity is billing cycle update', async () => {
        await setBaseCaseToTeamYearlyOneEditorWithActivity()
        await db('workspace_subscriptions')
          .where({ workspaceId: workspace.id })
          .update({
            billingInterval: 'monthly'
          })

        const subscriptions = await getUntrackedSubscriptions(LIMIT)

        expect(subscriptions).to.be.an('array').that.has.lengthOf(1)
      })
    }
  )
})
