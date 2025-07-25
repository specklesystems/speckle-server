import {
  getStripeSubscriptionDataFactory,
  reconcileWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/clients/stripe'
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
} from '@/modules/gatekeeper/helpers/prices'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import type { Knex } from 'knex'
import type { GetStripeClient } from '@/modules/gatekeeper/domain/billing'

export const initializeEventListenersFactory =
  ({ db, getStripeClient }: { db: Knex; getStripeClient: GetStripeClient }) =>
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
              getStripeClient,
              getStripeSubscriptionData: getStripeSubscriptionDataFactory({
                getStripeClient
              })
            }),
            upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db }),
            countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({ db })
          })

        await addWorkspaceSubscriptionSeatIfNeeded({
          ...payload.seat,
          updatedByUserId: payload.updatedByUserId,
          seatType: payload.seat.type
        })
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
