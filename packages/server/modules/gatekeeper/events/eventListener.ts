import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  upsertTrialWorkspacePlanFactory,
  upsertUnpaidWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { addWorkspaceSubscriptionSeatIfNeededFactory } from '@/modules/gatekeeper/services/subscriptions'
import {
  getWorkspacePlanPriceId,
  getWorkspacePlanProductId
} from '@/modules/gatekeeper/stripe'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { countWorkspaceRoleWithOptionalProjectRoleFactory } from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import Stripe from 'stripe'

const { FF_GATEKEEPER_FORCE_FREE_PLAN } = getFeatureFlags()

export const initializeEventListenersFactory =
  ({ db, stripe }: { db: Knex; stripe: Stripe }) =>
  () => {
    const eventBus = getEventBus()
    const quitCbs = [
      eventBus.listen(WorkspaceEvents.RoleUpdated, async ({ payload }) => {
        const addWorkspaceSubscriptionSeatIfNeeded =
          addWorkspaceSubscriptionSeatIfNeededFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
            countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({
              db
            }),
            getWorkspacePlanPriceId,
            getWorkspacePlanProductId,
            reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({ stripe })
          })

        await addWorkspaceSubscriptionSeatIfNeeded(payload)
      }),
      eventBus.listen(WorkspaceEvents.Created, async ({ payload }) => {
        // TODO: based on a feature flag, we can force new workspaces into the free plan here
        if (FF_GATEKEEPER_FORCE_FREE_PLAN) {
          await upsertUnpaidWorkspacePlanFactory({ db })({
            workspacePlan: {
              name: 'free',
              status: 'valid',
              workspaceId: payload.workspace.id,
              createdAt: new Date()
            }
          })
        } else {
          await upsertTrialWorkspacePlanFactory({ db })({
            workspacePlan: {
              name: 'starter',
              status: 'trial',
              workspaceId: payload.workspace.id,
              createdAt: new Date()
            }
          })
        }
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
