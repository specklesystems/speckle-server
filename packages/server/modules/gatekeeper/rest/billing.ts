import { Router } from 'express'
import { ensureError } from '@speckle/shared'
import { Stripe } from 'stripe'
import { getStripeEndpointSigningKey } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { completeCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import {
  getSubscriptionDataFactory,
  parseSubscriptionData
} from '@/modules/gatekeeper/clients/stripe'
import {
  deleteCheckoutSessionFactory,
  getCheckoutSessionFactory,
  getWorkspacePlanFactory,
  upsertWorkspaceSubscriptionFactory,
  updateCheckoutSessionStatusFactory,
  upsertPaidWorkspacePlanFactory,
  getWorkspaceSubscriptionBySubscriptionIdFactory
} from '@/modules/gatekeeper/repositories/billing'
import { WorkspaceAlreadyPaidError } from '@/modules/gatekeeper/errors/billing'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { getStripeClient } from '@/modules/gatekeeper/stripe'
import { handleSubscriptionUpdateFactory } from '@/modules/gatekeeper/services/subscriptions'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { extendLoggerComponent } from '@/logging/logging'
import { OperationName, OperationStatus, stripeEventId } from '@/logging/domain/fields'
import { logWithErr } from '@/logging/graphqlError'

export const getBillingRouter = (): Router => {
  const router = Router()

  router.post('/api/v1/billing/webhooks', async (req, res) => {
    const endpointSecret = getStripeEndpointSigningKey()
    const sig = req.headers['stripe-signature']
    if (!sig) {
      res.status(400).send('Missing payload signature')
      return
    }

    // req.log will have request ID property, so all subsequent log messages can be traced
    let logger = extendLoggerComponent(req.log, 'gatekeeper', 'rest', 'billing')

    const stripe = getStripeClient()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        // yes, the express json middleware auto parses the payload and stri need it in a string
        req.body,
        sig,
        endpointSecret
      )
    } catch (err) {
      const e = ensureError(err, 'Unknown error constructing Stripe webhook event')
      res.status(400).json({ error: e.message })
      return
    }
    if ('id' in event.data.object)
      logger = logger.child(stripeEventId(event.data.object.id))

    switch (event.type) {
      case 'checkout.session.async_payment_failed':
        // if payment fails, we delete the failed session
        try {
          logger = logger.child(OperationName('deleteCheckoutSession'))
          logger.info(
            OperationStatus.start,
            '[{operationName} ({operationStatus})] Payment failed.'
          )
          await deleteCheckoutSessionFactory({ db })({
            checkoutSessionId: event.data.object.id
          })
          logger.info(OperationStatus.success, '[{operationName} ({operationStatus})]')
        } catch (err) {
          logWithErr(logger, err)(
            OperationStatus.failure,
            '[{operationName} ({operationStatus})]'
          )
        }
        break
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed':
        const session = event.data.object

        if (!session.subscription) {
          logger.warn('Received a checkout session without a subscription')
          return res.status(400).send('We only support subscription type checkouts')
        }

        switch (session.payment_status) {
          case 'no_payment_required':
            // we do not need to support this status
            logger.info(
              'Payment succeeded or Stripe session completed, and no payment was required'
            )
            break
          case 'paid':
            // If the workspace is already on a paid plan, we made a bo bo.
            // existing subs should be updated via the api, not pushed through the checkout sess again
            // the start checkout endpoint should guard this!
            // get checkout session from the DB, if not found CONTACT SUPPORT!!!
            // if the session is already paid, means, we've already settled this checkout, and this is a webhook recall
            // set checkout state to paid
            // go ahead and provision the plan
            // store customer id and subscription Id associated to the workspace plan

            const subscriptionId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id

            logger = logger.child({
              subscriptionId,
              ...OperationName('completeCheckoutSession')
            })
            logger.info(
              OperationStatus.start,
              '[{operationName} ({operationStatus})] Payment succeeded or Stripe session completed, and payment was paid'
            )

            // this must use a transaction

            const trx = await db.transaction()

            const completeCheckout = completeCheckoutSessionFactory({
              getCheckoutSession: getCheckoutSessionFactory({ db: trx }),
              updateCheckoutSessionStatus: updateCheckoutSessionStatusFactory({
                db: trx
              }),
              upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db: trx }),
              upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({
                db: trx
              }),
              getSubscriptionData: getSubscriptionDataFactory({
                stripe
              }),
              emitEvent: getEventBus().emit
            })

            try {
              await withTransaction(
                completeCheckout({
                  sessionId: session.id,
                  subscriptionId
                }),
                trx
              )
              logger.info(
                OperationStatus.success,
                '[{operationName} ({operationStatus})]'
              )
            } catch (err) {
              if (err instanceof WorkspaceAlreadyPaidError) {
                // ignore the request, this is prob a replay from stripe
                logger.info('Workspace is already paid, ignoring')
              } else {
                logWithErr(logger, err)(
                  OperationStatus.failure,
                  '[{operationName} ({operationStatus})]'
                )
                throw err
              }
            }

            break
          case 'unpaid':
            // if payment fails, we delete the failed session
            try {
              logger = logger.child(OperationName('deleteCheckoutSession'))
              logger.info(
                OperationStatus.start,
                '[{operationName} ({operationStatus})] Payment succeeded or Stripe session completed, but payment was not made.'
              )
              await deleteCheckoutSessionFactory({ db })({
                checkoutSessionId: event.data.object.id
              })
              logger.info(
                OperationStatus.success,
                '[{operationName} ({operationStatus})]'
              )
            } catch (err) {
              const e = ensureError(err, 'Unknown error deleting checkout session')
              logWithErr(logger, e)(
                OperationStatus.failure,
                '[{operationName} ({operationStatus})]'
              )
            }
        }
        break

      case 'checkout.session.expired':
        try {
          logger.info('Checkout session expired, attempting to delete checkout session')
          // delete the checkout session from the DB
          await deleteCheckoutSessionFactory({ db })({
            checkoutSessionId: event.data.object.id
          })
        } catch (err) {
          const e = ensureError(err, 'Unknown error deleting checkout session')
          logger.error({ err: e }, 'Failed to delete checkout session')
        }
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        try {
          logger.info(
            'Received subscription update event. Attempting to update workspace subscription'
          )
          await handleSubscriptionUpdateFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
            getWorkspaceSubscriptionBySubscriptionId:
              getWorkspaceSubscriptionBySubscriptionIdFactory({ db }),
            upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db })
          })({ subscriptionData: parseSubscriptionData(event.data.object) })
          logger.info('Workspace subscription successfully updated')
        } catch (err) {
          const e = ensureError(err, 'Unknown error handling subscription update')
          logger.error({ err: e }, 'Failed to handle subscription update')
        }
        break

      default:
        break
    }

    res.status(200).send('ok')
  })

  return router
}
