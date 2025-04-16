import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import {
  throwUncoveredError,
  WorkspacePlan,
  WorkspacePlans,
  WorkspacePlanStatuses
} from '@speckle/shared'
import { getWorkspaceRolesFactory } from '@/modules/workspaces/repositories/workspaces'
import {
  SubscriptionDataInput,
  WorkspaceSeat
} from '@/modules/gatekeeper/domain/billing'
import { Knex } from 'knex'
import {
  getWorkspacePlanPriceId,
  getWorkspacePlanProductId
} from '@/modules/gatekeeper/stripe'
import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import Stripe from 'stripe'
import { cloneDeep } from 'lodash'
import { Logger } from '@/observability/logging'

// get all workspace plan from the DB
// foreach workspace:

export const migrateOldWorkspacePlans =
  ({ db, stripe, logger }: { db: Knex; stripe: Stripe; logger: Logger }) =>
  async () => {
    const oldPlanWorkspaces = await db<WorkspacePlan & { workspaceId: string }>(
      'workspace_plans'
    )
      .select('*')
      .whereIn('name', [
        'business',
        'businessInvoiced',
        'plus',
        'plusInvoiced',
        'starter',
        'starterInvoiced',
        'academia',
        'unlimited'
      ])

    if (oldPlanWorkspaces.length === 0) {
      logger.info('No old workspace plans to migrate')
      return
    }

    for (const oldPlan of oldPlanWorkspaces) {
      try {
        await migrateWorkspacePlan({ db, stripe, logger })({
          workspaceId: oldPlan.workspaceId
        })
      } catch (err) {
        logger.error(
          { err, workspaceId: oldPlan.workspaceId, oldPlan },
          'Failed to migrate workspace plan'
        )
      }
    }
  }

export const migrateWorkspacePlan =
  ({ db, stripe, logger }: { db: Knex; stripe: Stripe; logger: Logger }) =>
  async ({ workspaceId }: { workspaceId: string }) => {
    let log = logger.child({ workspaceId })
    log.info('Starting workspace plan migration for {workspaceId}')
    const workspacePlan = await getWorkspacePlanFactory({ db })({ workspaceId })
    if (!workspacePlan)
      throw new Error(`Workspace ${workspaceId} has no workspace plan`)

    log = log.child({ workspacePlan })

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
            throw new Error(
              `Cant migrate workspace ${workspaceId}, its currently an old 'starter' plan that has failed in payment`
            )
          case 'canceled':
            // just switch the plan, no need to change stripe
            newTargetPlan = 'teamUnlimited'
            newPlanStatus = workspacePlan.status
            break
          case 'cancelationScheduled':
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
        switch (workspacePlan.status) {
          case 'paymentFailed':
            throw new Error(
              `Cant migrate workspace ${workspaceId}, its currently an old 'business' plan that has failed in payment`
            )
          case 'canceled':
            newTargetPlan = 'proUnlimited'
            isStripeMigrationNeeded = false
            newPlanStatus = workspacePlan.status
            break
          case 'cancelationScheduled':
          case 'valid':
            newTargetPlan = 'proUnlimited'
            isStripeMigrationNeeded = true
            newPlanStatus = workspacePlan.status
            break
          default:
            throwUncoveredError(workspacePlan)
        }
        break
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
        break
      case 'free':
        break

      default:
        throwUncoveredError(workspacePlan)
    }

    if (!newTargetPlan) {
      log.info('No migration needed for {workspaceId} from old plan {workspacePlan}')
      return
    }

    log.info(
      { newTargetPlan, newPlanStatus, isStripeMigrationNeeded },
      'Migrating {workspaceId} from old plan {workspacePlan} to new plan {newTargetPlan}'
    )

    const trx = await db.transaction()
    // add editor seats to everyone

    try {
      const workspaceMembers = await getWorkspaceRolesFactory({ db: trx })({
        workspaceId
      })
      const seats = workspaceMembers.map((m) => ({
        workspaceId,
        userId: m.userId,
        type: 'editor' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      log.debug(
        { migratedSeats: seats, migratedSeatsCount: seats.length },
        'Inserting {migratedSeatsCount} new seats for the workspace {workspaceId}'
      )

      await trx<WorkspaceSeat>('workspace_seats')
        .insert(seats)
        .onConflict(['workspaceId', 'userId'])
        .merge()

      log.debug(
        { migratedSeatsCount: seats.length },
        'Workspace {workspaceId} has added {migratedSeatsCount} seats'
      )
      await upsertWorkspacePlanFactory({ db: trx })({
        //@ts-expect-error the switch above makes sure things are ok
        workspacePlan: {
          workspaceId,
          name: newTargetPlan,
          status: newPlanStatus ?? workspacePlan.status,
          createdAt: workspacePlan.createdAt
        }
      })
      log.debug(
        'workspace {workspaceId} has had plan {workspacePlan} changed to the new plan {newTargetPlan}'
      )
      if (isStripeMigrationNeeded) {
        log.info('Migrating stripe subscription data for workspace {workspaceId}')
        switch (newTargetPlan) {
          case 'academia':
          case 'free':
          case 'proUnlimitedInvoiced':
          case 'teamUnlimitedInvoiced':
          case 'unlimited':
            // this is just double checking that everything is right
            // the switch above sets things up properly
            throw new Error(
              `Cannot upgrade stripe for a non paid plan for workspace ${workspaceId}`
            )
        }
        // if stripe paid plan, convert the stripe sub to use all editor seats
        const workspaceSubscription = await getWorkspaceSubscriptionFactory({
          db: trx
        })({
          workspaceId
        })
        if (!workspaceSubscription)
          throw new Error(
            `Subscription data not found for workspace ${workspaceId}, cannot do stripe migration`
          )

        let memberAndGuestSeatCount = workspaceSubscription.subscriptionData.products
          .map((p) => p.quantity)
          // we're just summing all the seats
          .reduce((acc, curr) => acc + curr, 0)

        const workspaceTeamCount = workspaceMembers.length
        if (memberAndGuestSeatCount < workspaceTeamCount) {
          log.warn(
            { memberAndGuestSeatCount, workspaceTeamCount },
            'Workspace {workspaceId} has less paid member and guest seats, than people in the workspace. Reconciling'
          )
          memberAndGuestSeatCount = workspaceTeamCount
        }
        const productId = getWorkspacePlanProductId({ workspacePlan: newTargetPlan })
        const priceId = getWorkspacePlanPriceId({
          workspacePlan: newTargetPlan,
          billingInterval: workspaceSubscription.billingInterval,
          currency: workspaceSubscription.currency
        })

        const subscriptionData: SubscriptionDataInput = cloneDeep(
          workspaceSubscription.subscriptionData
        )
        subscriptionData.products = []

        subscriptionData.products.push({
          productId,
          priceId,
          quantity: memberAndGuestSeatCount
        })

        await reconcileWorkspaceSubscriptionFactory({ stripe })({
          subscriptionData,
          prorationBehavior: 'create_prorations'
        })
      }
      await trx.commit()
      log.info('🥳 Workspace plan migration completed for workspace {workspaceId}')
    } catch (err) {
      await trx.rollback()
      throw err
    }

    // add and editor seat to all workspace members
    // convert current plan to the new plan
    // if plan in cancelled, still convert to the new plan
    // if cancellation scheduled, skip migration, we'll deal with that manually
    //
  }
