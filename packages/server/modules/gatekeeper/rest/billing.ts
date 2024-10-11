import { Router } from 'express'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { authorizeResolver } from '@/modules/shared'
import { ensureError, Roles, throwUncoveredError } from '@speckle/shared'
import { Stripe } from 'stripe'
import {
  getFrontendOrigin,
  getStripeApiKey,
  getStripeEndpointSigningKey,
  getWorkspaceBusinessSeatStripePriceId,
  getWorkspaceGuestSeatStripePriceId,
  getWorkspaceProSeatStripePriceId,
  getWorkspaceTeamSeatStripePriceId
} from '@/modules/shared/helpers/envHelper'
import {
  WorkspacePlanBillingIntervals,
  workspacePlans,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceBySlugFactory
} from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { createCheckoutSessionFactory } from '@/modules/gatekeeper/clients/stripe'
import { CheckoutSession } from '@/modules/gatekeeper/domain/billing'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'

const router = Router()

export default router

const stripe = new Stripe(getStripeApiKey(), { typescript: true })

let checkoutSession: CheckoutSession | undefined

const getWorkspacePlanPrice = ({
  workspacePlan
}: {
  workspacePlan: WorkspacePricingPlans
  billingInterval: WorkspacePlanBillingIntervals
}): string => {
  // right now, ignoring interval
  switch (workspacePlan) {
    case 'team':
      return getWorkspaceTeamSeatStripePriceId()
    case 'pro':
      return getWorkspaceProSeatStripePriceId()
    case 'business':
      return getWorkspaceBusinessSeatStripePriceId()
    case 'guest':
      return getWorkspaceGuestSeatStripePriceId()
    default:
      throwUncoveredError(workspacePlan)
  }
}

router.get(
  '/api/v1/billing/workspaces/:workspaceSlug/checkout-session/:workspacePlan',
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1),
      workspacePlan: workspacePlans
    })
  }),
  async (req) => {
    const { workspaceSlug, workspacePlan } = req.params
    const workspace = await getWorkspaceBySlugFactory({ db })({ workspaceSlug })
    if (!workspace) throw new WorkspaceNotFoundError()

    const workspaceId = workspace.id
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
      getWorkspacePlan: getWorkspacePlanFactory(),
      countRole,
      createCheckoutSession,
      storeCheckoutSession: async (args: { checkoutSession: CheckoutSession }) => {
        checkoutSession = args.checkoutSession
      }
    })({ workspacePlan, workspaceId, workspaceSlug, billingInterval: 'monthly' })

    req.res?.redirect(session.url)
  }
)

// const fulfillCheckoutFactory =
//   ({ stripe }: { stripe: Stripe }) =>
//   async ({ sessionId }: { sessionId: string }) => {
//     // Set your secret key. Remember to switch to your live secret key in production.
//     // See your keys here: https://dashboard.stripe.com/apikeys

//     console.log('Fulfilling Checkout Session ' + sessionId)

//     // TODO: Make this function safe to run multiple times,
//     // even concurrently, with the same session ID

//     // TODO: Make sure fulfillment hasn't already been
//     // peformed for this Checkout Session

//     // Retrieve the Checkout Session from the API with line_items expanded
//     const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ['line_items']
//     })

//     // Check the Checkout Session's payment_status property
//     // to determine if fulfillment should be peformed
//     if (checkoutSession.payment_status !== 'unpaid') {
//       // TODO: Perform fulfillment of the line items
//       // TODO: Record/save fulfillment status for this
//       // Checkout Session
//     }
//   }

router.post('/api/v1/billing/webhooks', async (req, res) => {
  const endpointSecret = getStripeEndpointSigningKey()
  const sig = req.headers['stripe-signature']
  if (!sig) {
    res.status(400).send('Missing payload signature')
    return
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    res.status(400).send(`Webhook Error: ${ensureError(err).message}`)
    return
  }

  switch (event.type) {
    case 'checkout.session.async_payment_failed':
      // TODO: need to alert the user
      break
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.completed':
      const session = event.data.object

      if (session.payment_status !== 'unpaid') {
        // IDK yet, but if the workspace is already on a paid plan, we made a bo bo.
        // existing subs should be updated via the api, not pushed through the checkout sess again
        // the start checkout endpoint should guard this!
        // get checkout session from the DB, if not found CONTACT SUPPORT!!!
        // if the session is already paid, means, we've already settled this checkout, and this is a webhook recall
        // set checkout state to paid
        // go ahead and provision the plan
      }

      if (checkoutSession?.id !== session.id) throw new Error('session mismatch')
    // move the workspace plan to the new plan
    case 'checkout.session.expired':
    default:
      break
  }

  res.status(200).send('ok')
})

// prob needed when the checkout is cancelled
router.delete(
  '/api/v1/billing/workspaces/:workspaceSlug/checkout-session/:workspacePlan'
)
