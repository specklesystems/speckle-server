import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { countSeatsByTypeInWorkspaceFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { addWorkspaceSubscriptionSeatIfNeededFactory } from '@/modules/gatekeeper/services/subscriptions'
import {
  getWorkspacePlanPriceId,
  getWorkspacePlanProductId
} from '@/modules/gatekeeper/stripe'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import Stripe from 'stripe'

export const initializeEventListenersFactory =
  ({ db, stripe }: { db: Knex; stripe: Stripe }) =>
  () => {
    const eventBus = getEventBus()
    const quitCbs = [
      eventBus.listen(WorkspaceEvents.SeatUpdated, async ({ payload }) => {
        const addWorkspaceSubscriptionSeatIfNeeded =
          addWorkspaceSubscriptionSeatIfNeededFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
            getWorkspacePlanPriceId,
            getWorkspacePlanProductId,
            reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
              stripe
            }),
            upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db }),
            countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({ db })
          })

        await addWorkspaceSubscriptionSeatIfNeeded({
          ...payload.seat,
          seatType: payload.seat.type
        })
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
