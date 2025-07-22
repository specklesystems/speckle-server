import { Router } from 'express'
import { ensureError } from '@speckle/shared'
import { Stripe } from 'stripe'
import { getStripeEndpointSigningKey } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { completeCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import {
  getStripeClient,
  getStripeSubscriptionDataFactory,
  parseSubscriptionData
} from '@/modules/gatekeeper/clients/stripe'
import {
  deleteCheckoutSessionFactory,
  getCheckoutSessionFactory,
  getWorkspacePlanFactory,
  upsertWorkspaceSubscriptionFactory,
  updateCheckoutSessionStatusFactory,
  upsertPaidWorkspacePlanFactory,
  getWorkspaceSubscriptionBySubscriptionIdFactory,
  getWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { WorkspaceAlreadyPaidError } from '@/modules/gatekeeper/errors/billing'
import { handleSubscriptionUpdateFactory } from '@/modules/gatekeeper/services/subscriptions'
import { GetStripeClient, SubscriptionData } from '@/modules/gatekeeper/domain/billing'
import { extendLoggerComponent } from '@/observability/logging'
import {
  OperationName,
  OperationStatus,
  stripeEventId
} from '@/observability/domain/fields'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { asOperation } from '@/modules/shared/command'
import { getEventBus } from '@/modules/shared/services/eventBus'

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

        await withOperationLogging(
          async () =>
            await deleteCheckoutSessionFactory({ db })({
              checkoutSessionId: event.data.object.id
            }),
          {
            logger,
            operationName: 'deleteCheckoutSession',
            operationDescription: 'Payment failed'
          }
        )

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
            logger.info(OperationStatus.start, '[{operationName} ({operationStatus})] ')

            await asOperation(
              async ({ db, emit }) => {
                try {
                  const completeCheckout = completeCheckoutSessionFactory({
                    getCheckoutSession: getCheckoutSessionFactory({ db }),
                    updateCheckoutSessionStatus: updateCheckoutSessionStatusFactory({
                      db
                    }),
                    upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
                    upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({
                      db
                    }),
                    getWorkspacePlan: getWorkspacePlanFactory({ db }),
                    getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
                    getSubscriptionData: getStripeSubscriptionDataFactory({
                      getStripeClient
                    }),
                    emitEvent: emit
                  })

                  return completeCheckout({
                    sessionId: session.id,
                    subscriptionId
                  })
                } catch (e) {
                  if (e instanceof WorkspaceAlreadyPaidError) {
                    // ignore the request, this is prob a replay from stripe
                    logger.info('Workspace is already paid, ignoring')
                  } else {
                    throw e
                  }
                }
              },
              {
                logger,
                name: 'completeCheckoutSession',
                description:
                  'Payment succeeded or Stripe session completed, and payment was paid',
                transaction: true
              }
            )

            break
          case 'unpaid':
            // if payment fails, we delete the failed session
            await withOperationLogging(
              async () =>
                await deleteCheckoutSessionFactory({ db })({
                  checkoutSessionId: event.data.object.id
                }),
              {
                logger,
                operationName: 'deleteCheckoutSession',
                operationDescription:
                  'Payment succeeded or Stripe session completed, but payment was not made'
              }
            )
            break
        }
        break

      case 'checkout.session.expired':
        await withOperationLogging(
          async () =>
            await deleteCheckoutSessionFactory({ db })({
              checkoutSessionId: event.data.object.id
            }),
          {
            logger,
            operationName: 'deleteCheckoutSession',
            operationDescription:
              'Checkout session expired, attempting to delete checkout session'
          }
        )
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await withOperationLogging(
          async () =>
            await handleSubscriptionUpdateFactory({
              getWorkspacePlan: getWorkspacePlanFactory({ db }),
              upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
              getWorkspaceSubscriptionBySubscriptionId:
                getWorkspaceSubscriptionBySubscriptionIdFactory({ db }),
              upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db }),
              emitEvent: getEventBus().emit
            })({ subscriptionData: parseSubscriptionData(event.data.object), logger }),
          {
            logger,
            operationName: 'handleSubscriptionUpdate',
            operationDescription:
              'Subscription was updated or deleted; now handling the subscription update'
          }
        )
        break
      case 'invoice.created':
        const subscriptionData = await getSubscriptionFromEventFactory({
          getStripeClient
        })(event)
        if (!subscriptionData) break
        await withOperationLogging(
          async () =>
            await handleSubscriptionUpdateFactory({
              getWorkspacePlan: getWorkspacePlanFactory({ db }),
              upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
              getWorkspaceSubscriptionBySubscriptionId:
                getWorkspaceSubscriptionBySubscriptionIdFactory({ db }),
              upsertWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db }),
              emitEvent: getEventBus().emit
            })({ subscriptionData, logger }),
          {
            logger,
            operationName: 'handleSubscriptionUpdate',
            operationDescription:
              'Invoice was created; now handling the subscription update'
          }
        )
        break

      default:
        break
    }

    res.status(200).send('ok')
  })

  return router
}

const getSubscriptionFromEventFactory =
  ({ getStripeClient }: { getStripeClient: GetStripeClient }) =>
  async (event: Stripe.InvoiceCreatedEvent): Promise<SubscriptionData | null> => {
    const subscription = event.data.object.subscription
    if (!subscription) {
      return null
    }
    if (typeof subscription === 'string') {
      return await getStripeSubscriptionDataFactory({ getStripeClient })({
        subscriptionId: subscription
      })
    }
    return parseSubscriptionData(subscription)
  }
