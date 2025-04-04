import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import {
  throwUncoveredError,
  WorkspacePlans,
  WorkspacePlanStatuses
} from '@speckle/shared'
import { getWorkspaceRolesFactory } from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { Knex } from 'knex'
import { getSubscriptionDataFactory } from '../clients/stripe'
import { subscribe } from 'graphql'
import { getWorkspacePlanProductAndPriceIds } from '../stripe'

// get all workspace plan from the DB
// foreach workspace:
export const migrateWorkspacePlan =
  ({ db }: { db: Knex }) =>
  async ({ workspaceId }: { workspaceId: string }) => {
    const trx = await db.transaction()
    const workspacePlan = await getWorkspacePlanFactory({ db: trx })({ workspaceId })
    if (!workspacePlan)
      throw new Error(`Workspace ${workspaceId} has no workspace plan`)

    const workspaceMembers = await getWorkspaceRolesFactory({ db: trx })({
      workspaceId
    })
    // add editor seats to everyone
    await trx<WorkspaceSeat>('workspace_seats').insert(
      workspaceMembers.map((m) => ({
        workspaceId,
        userId: m.userId,
        type: 'editor',
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    )

    let newTargetPlan: WorkspacePlans | null = null
    let newPlanStatus: WorkspacePlanStatuses | null = null
    let isStripeMigrationNeeded = false
    switch (workspacePlan.name) {
      case 'team':
      case 'teamUnlimited':
      case 'pro':
      case 'proUnlimited':
      case 'teamUnlimitedInvoiced':
      case 'proUnlimitedInvoiced':
        // these are new plans already, no upgrades
        break
      case 'starter':
        switch (workspacePlan.status) {
          case 'trial':
          case 'expired':
            newPlanStatus = 'valid'
            newTargetPlan = 'free'
            break
          case 'paymentFailed':
            throw new Error('Cant migrate workspace, its currently failed in payment')
          case 'cancelationScheduled':
          case 'canceled':
            // just switch the plan, no need to change stripe
            newTargetPlan = 'teamUnlimited'
            newPlanStatus = workspacePlan.status
            break
          case 'valid':
            newTargetPlan = 'teamUnlimited'
            newPlanStatus = workspacePlan.status
            isStripeMigrationNeeded = true
            break
          default:
            throwUncoveredError(workspacePlan)
        }
        break
      case 'plus':
      case 'business':
        newTargetPlan = 'proUnlimited'
        switch (workspacePlan.status) {
          case 'paymentFailed':
            throw new Error('Cant migrate workspace, its currently failed in payment')
          case 'cancelationScheduled':
          case 'canceled':
            isStripeMigrationNeeded = false
            newPlanStatus = workspacePlan.status
            break
          case 'valid':
            isStripeMigrationNeeded = true
            newPlanStatus = workspacePlan.status
            break
          default:
            throwUncoveredError(workspacePlan)
        }
      case 'starterInvoiced':
        newTargetPlan = 'teamUnlimitedInvoiced'
        newPlanStatus = workspacePlan.status
        break
      case 'plusInvoiced':
      case 'businessInvoiced':
        newTargetPlan = 'proUnlimitedInvoiced'
        newPlanStatus = workspacePlan.status
        break
      case 'unlimited':
      case 'academia':
        newTargetPlan = workspacePlan.name
        newPlanStatus = workspacePlan.status
      case 'free':
        break

      default:
        throwUncoveredError(workspacePlan)
    }

    if (!newTargetPlan) return
    await upsertWorkspacePlanFactory({ db: trx })({
      //@ts-expect-error the switch above makes sure things are ok
      workspacePlan: {
        workspaceId,
        name: newTargetPlan,
        status: newPlanStatus ?? workspacePlan.status,
        createdAt: workspacePlan.createdAt
      }
    })
    if (isStripeMigrationNeeded) {
      // if stripe paid plan, convert the stripe sub to use all editor seats
      const subscriptionData = await getWorkspaceSubscriptionFactory({ db: trx })({
        workspaceId
      })
      if (!subscriptionData)
        throw new Error('Subscription data not found, cant do stripe migration')

      const memberAndGuestSeatCount = subscriptionData.subscriptionData.products
        .map((p) => p.quantity)
        // we're just summing all the seats
        .reduce((acc, curr) => acc + curr, 0)

      const newProductId = getWorkspacePlanProductAndPriceIds()
    }
    await trx.commit()

    // add and editor seat to all workspace members
    // convert current plan to the new plan
    // if plan in cancelled, still convert to the new plan
    // if cancellation scheduled, skip migration, we'll deal with that manually
    //
  }
