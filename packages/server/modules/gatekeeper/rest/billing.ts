import { Router } from 'express'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { authorizeResolver } from '@/modules/shared'
import { ensureError, Roles } from '@speckle/shared'
import { Stripe } from 'stripe'
import {
  getFrontendOrigin,
  getStringFromEnv,
  getStripeApiKey,
  getStripeEndpointSigningKey
} from '@/modules/shared/helpers/envHelper'
import {
  WorkspacePlanBillingIntervals,
  paidWorkspacePlans,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceBySlugFactory
} from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import {
  completeCheckoutSessionFactory,
  startCheckoutSessionFactory
} from '@/modules/gatekeeper/services/workspaces'
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
import { GetWorkspacePlanPrice } from '@/modules/gatekeeper/domain/billing'

const router = Router()

export default router

const stripe = new Stripe(getStripeApiKey(), { typescript: true })

const workspacePlanPrices = (): Record<
  WorkspacePricingPlans,
  Record<WorkspacePlanBillingIntervals, string> & { productId: string }
> => ({
  guest: {
    productId: getStringFromEnv('WORKSPACE_GUEST_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_GUEST_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_GUEST_SEAT_STRIPE_PRICE_ID')
  },
  team: {
    productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_STRIPE_PRICE_ID')
  },
  pro: {
    productId: getStringFromEnv('WORKSPACE_PRO_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_STRIPE_PRICE_ID')
  },
  business: {
    productId: getStringFromEnv('WORKSPACE_BUSINESS_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_BUSINESS_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_BUSINESS_SEAT_STRIPE_PRICE_ID')
  }
})

const getWorkspacePlanPrice: GetWorkspacePlanPrice = ({
  workspacePlan,
  billingInterval
}) => workspacePlanPrices()[workspacePlan][billingInterval]

router.get(
  '/api/v1/billing/workspaces/:workspaceSlug/checkout-session/:workspacePlan',
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1),
      workspacePlan: paidWorkspacePlans
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
      getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory(),
      getWorkspacePlan: getWorkspacePlanFactory(),
      countRole,
      createCheckoutSession,
      saveCheckoutSession: saveCheckoutSessionFactory()
    })({ workspacePlan, workspaceId, workspaceSlug, billingInterval: 'monthly' })

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
      // TODO: need to alert the user and delete the session ?
      break
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.completed':
      const session = event.data.object

      if (!session.subscription)
        return res.status(400).send('We only support subscription type checkouts')

      if (session.payment_status === 'paid') {
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
        const completeCheckout = completeCheckoutSessionFactory({
          getCheckoutSession: getCheckoutSessionFactory(),
          updateCheckoutSessionStatus: updateCheckoutSessionStatusFactory(),
          upsertPaidWorkspacePlan: upsertPaidWorkspacePlanFactory(),
          saveWorkspaceSubscription: saveWorkspaceSubscriptionFactory(),
          getSubscriptionData: getSubscriptionDataFactory({
            stripe
          })
        })

        await completeCheckout({
          sessionId: session.id,
          subscriptionId
        })
      }
      break

    case 'checkout.session.expired':
      // delete the checkout session from the DB
      await deleteCheckoutSessionFactory()({ checkoutSessionId: event.data.object.id })
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
