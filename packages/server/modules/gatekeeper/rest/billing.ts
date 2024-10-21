import { Router } from 'express'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { ensureError, Roles, Scopes } from '@speckle/shared'
import { Stripe } from 'stripe'
import {
  getFrontendOrigin,
  getStripeEndpointSigningKey
} from '@/modules/shared/helpers/envHelper'
import {
  paidWorkspacePlans,
  workspacePlanBillingIntervals
} from '@/modules/gatekeeper/domain/workspacePricing'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import {
  completeCheckoutSessionFactory,
  startCheckoutSessionFactory
} from '@/modules/gatekeeper/services/checkout'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import {
  createCheckoutSessionFactory,
  getSubscriptionDataFactory
} from '@/modules/gatekeeper/clients/stripe'
import {
  deleteCheckoutSessionFactory,
  getCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  saveCheckoutSessionFactory,
  saveWorkspaceSubscriptionFactory,
  updateCheckoutSessionStatusFactory,
  upsertPaidWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { WorkspaceAlreadyPaidError } from '@/modules/gatekeeper/errors/billing'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { stripe, getWorkspacePlanPrice } from '@/modules/gatekeeper/stripe'

const router = Router()

export default router

// this prob needs to be turned into a GQL resolver for better frontend integration for errors
router.get(
  '/api/v1/billing/workspaces/:workspaceId/checkout-session/:workspacePlan/:billingInterval',
  validateRequest({
    params: z.object({
      workspaceId: z.string().min(1),
      workspacePlan: paidWorkspacePlans,
      billingInterval: workspacePlanBillingIntervals
    })
  }),
  async (req) => {
    const { workspaceId, workspacePlan, billingInterval } = req.params
    const workspace = await getWorkspaceFactory({ db })({ workspaceId })

    if (!workspace) throw new WorkspaceNotFoundError()

    await validateScopes(req.context.scopes, Scopes.Gatekeeper.WorkspaceBilling)
    await authorizeResolver(
      req.context.userId,
      workspaceId,
      Roles.Workspace.Admin,
      req.context.resourceAccessRules
    )

    const createCheckoutSession = createCheckoutSessionFactory({
      stripe,
      frontendOrigin: getFrontendOrigin(),
      getWorkspacePlanPrice
    })

    const countRole = countWorkspaceRoleWithOptionalProjectRoleFactory({ db })

    const session = await startCheckoutSessionFactory({
      getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      countRole,
      createCheckoutSession,
      saveCheckoutSession: saveCheckoutSessionFactory({ db })
    })({ workspacePlan, workspaceId, workspaceSlug: workspace.slug, billingInterval })

    req.res?.redirect(session.url)
  }
)

router.post('/api/v1/billing/webhooks', async (req, res) => {
  const endpointSecret = getStripeEndpointSigningKey()
  const sig = req.headers['stripe-signature']
  if (!sig) {
    res.status(400).send('Missing payload signature')
    return
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      // yes, the express json middleware auto parses the payload and stri need it in a string
      req.body,
      sig,
      endpointSecret
    )
  } catch (err) {
    res.status(400).send(`Webhook Error: ${ensureError(err).message}`)
    return
  }

  switch (event.type) {
    case 'checkout.session.async_payment_failed':
      // if payment fails, we delete the failed session
      await deleteCheckoutSessionFactory({ db })({
        checkoutSessionId: event.data.object.id
      })
      break
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.completed':
      const session = event.data.object

      if (!session.subscription)
        return res.status(400).send('We only support subscription type checkouts')

      switch (session.payment_status) {
        case 'no_payment_required':
          // we do not need to support this status
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

          // this must use a transaction

          const trx = await db.transaction()

          const completeCheckout = completeCheckoutSessionFactory({
            getCheckoutSession: getCheckoutSessionFactory({ db: trx }),
            updateCheckoutSessionStatus: updateCheckoutSessionStatusFactory({
              db: trx
            }),
            upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory({ db: trx }),
            saveWorkspaceSubscription: saveWorkspaceSubscriptionFactory({ db: trx }),
            getSubscriptionData: getSubscriptionDataFactory({
              stripe
            })
          })

          try {
            await withTransaction(
              completeCheckout({
                sessionId: session.id,
                subscriptionId
              }),
              trx
            )
          } catch (err) {
            if (err instanceof WorkspaceAlreadyPaidError) {
              // ignore the request, this is prob a replay from stripe
            } else {
              throw err
            }
          }

          break
        case 'unpaid':
          // if payment fails, we delete the failed session
          await deleteCheckoutSessionFactory({ db })({
            checkoutSessionId: event.data.object.id
          })
      }
      break

    case 'checkout.session.expired':
      // delete the checkout session from the DB
      await deleteCheckoutSessionFactory({ db })({
        checkoutSessionId: event.data.object.id
      })
      break

    default:
      break
  }

  res.status(200).send('ok')
})

// prob needed when the checkout is cancelled
router.delete(
  '/api/v1/billing/workspaces/:workspaceSlug/checkout-session/:workspacePlan'
)
