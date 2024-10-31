import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { addWorkspaceSubscriptionSeatIfNeededFactory } from '@/modules/gatekeeper/services/subscriptions'
import {
  getWorkspacePlanPrice,
  getWorkspacePlanProductId
} from '@/modules/gatekeeper/stripe'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { countWorkspaceRoleWithOptionalProjectRoleFactory } from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import Stripe from 'stripe'

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
            getWorkspacePlanPrice,
            getWorkspacePlanProductId,
            reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({ stripe })
          })

        await addWorkspaceSubscriptionSeatIfNeeded(payload)
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
