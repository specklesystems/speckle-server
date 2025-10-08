import type {
  Currency,
  WorkspacePlanProductPrices,
  WorkspacePricingProducts
} from '@/modules/gatekeeperCore/domain/billing'
import type { SubscriptionState } from '@/modules/gatekeeperCore/domain/events'
import type { Workspace, WorkspaceSeat } from '@/modules/workspacesCore/domain/types'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import type {
  Nullable,
  Optional,
  PaidWorkspacePlan,
  PaidWorkspacePlans,
  UnpaidWorkspacePlan,
  WorkspacePlan,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import type Stripe from 'stripe'
import type { OverrideProperties } from 'type-fest'
import { z } from 'zod'

export { Currency } from '@/modules/gatekeeperCore/domain/billing'
export { type WorkspaceSeat, WorkspaceSeatType }
export type {
  GetWorkspaceRoleAndSeat,
  GetWorkspaceRolesAndSeats
} from '@/modules/workspacesCore/domain/operations'

export type GetWorkspacePlan = (
  args:
    | {
        workspaceId: string
      }
    | { workspaceSlug: string }
) => Promise<WorkspacePlan | null>

export type GetWorkspacePlansByWorkspaceId = (args: {
  workspaceIds: string[]
}) => Promise<Record<string, WorkspacePlan>>

export type GetWorkspaceWithPlan = (args: {
  workspaceId: string
}) => Promise<Optional<Workspace & { plan: Nullable<WorkspacePlan> }>>

export type UpsertPaidWorkspacePlan = (args: {
  workspacePlan: PaidWorkspacePlan
}) => Promise<void>

export type UpsertUnpaidWorkspacePlan = (args: {
  workspacePlan: UnpaidWorkspacePlan
}) => Promise<void>

export type UpsertWorkspacePlan = (args: {
  workspacePlan: WorkspacePlan
}) => Promise<void>

export type SessionInput = {
  id: string
}

export type SessionPaymentStatus = 'paid' | 'unpaid'

export type CheckoutSession = SessionInput & {
  url: string
  workspaceId: string
  userId: string
  workspacePlan: PaidWorkspacePlans
  paymentStatus: SessionPaymentStatus
  billingInterval: WorkspacePlanBillingIntervals
  currency: Currency
  createdAt: Date
  updatedAt: Date
}

export type SaveCheckoutSession = (args: {
  checkoutSession: CheckoutSession
}) => Promise<void>

export type GetCheckoutSession = (args: {
  sessionId: string
}) => Promise<CheckoutSession | null>

export type DeleteCheckoutSession = (args: {
  checkoutSessionId: string
}) => Promise<void>

export type GetWorkspaceCheckoutSession = (args: {
  workspaceId: string
}) => Promise<CheckoutSession | null>

export type UpdateCheckoutSessionStatus = (args: {
  sessionId: string
  paymentStatus: SessionPaymentStatus
}) => Promise<void>

export type CreateCheckoutSession = (args: {
  workspaceId: string
  userId: string
  workspaceSlug: string
  editorsCount: number
  workspacePlan: PaidWorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
  isCreateFlow: boolean
  currency: Currency
}) => Promise<CheckoutSession>

export type WorkspaceSubscription = {
  workspaceId: string
  createdAt: Date
  updatedAt: Date
  currentBillingCycleEnd: Date
  billingInterval: WorkspacePlanBillingIntervals
  currency: Currency
  updateIntent: SubscriptionUpdateIntent | null
  subscriptionData: SubscriptionData
}

export type SubscriptionUpdateIntent = {
  userId: string
  products: SubscriptionIntentProduct[]
  planName: PaidWorkspacePlans
} & Pick<
  WorkspaceSubscription,
  // status is not needed cause its always provided by stripe
  'currentBillingCycleEnd' | 'currency' | 'billingInterval' | 'updatedAt'
>

const subscriptionProduct = z.object({
  productId: z.string(),
  subscriptionItemId: z.string(), // does not exist until billing is called with success
  priceId: z.string(),
  quantity: z.number()
})

export type SubscriptionProduct = z.infer<typeof subscriptionProduct>

type SubscriptionIntentProduct = Pick<
  SubscriptionProduct,
  'productId' | 'priceId' | 'quantity'
>

export const SubscriptionData = z.object({
  subscriptionId: z.string().min(1),
  customerId: z.string().min(1),
  cancelAt: z.date().nullable(),
  status: z.union([
    z.literal('incomplete'),
    z.literal('incomplete_expired'),
    z.literal('trialing'), // TODO: Should we get rid of trial related states?
    z.literal('active'),
    z.literal('past_due'),
    z.literal('canceled'),
    z.literal('unpaid'),
    z.literal('paused')
  ]),
  products: subscriptionProduct.array(),
  currentPeriodEnd: z.coerce.date()
})
// this abstracts the stripe sub data
export type SubscriptionData = z.infer<typeof SubscriptionData>

export const calculateSubscriptionSeats = ({
  subscriptionData
}: {
  subscriptionData: SubscriptionData
}): number => {
  const product = subscriptionData.products[0]
  return product?.quantity || 0
}

export const getSubscriptionState = (
  subscription: WorkspaceSubscription
): SubscriptionState => ({
  billingInterval: subscription.billingInterval,
  totalEditorSeats: calculateSubscriptionSeats({
    subscriptionData: subscription.subscriptionData
  })
})

export type UpsertWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
}) => Promise<void>

export type GetWorkspaceSubscription = (args: {
  workspaceId: string
}) => Promise<WorkspaceSubscription | null>

export type GetWorkspaceSubscriptions = () => Promise<WorkspaceSubscription[]>

export type GetWorkspaceSubscriptionBySubscriptionId = (args: {
  subscriptionId: string
}) => Promise<WorkspaceSubscription | null>

export type GetStripeClient = () => Stripe

export type GetSubscriptionData = (args: {
  subscriptionId: string
}) => Promise<SubscriptionData>

export type GetWorkspacePlanPriceId = (args: {
  workspacePlan: WorkspacePricingProducts
  billingInterval: WorkspacePlanBillingIntervals
  currency: Currency
}) => string

export type GetWorkspacePlanProductId = (args: {
  workspacePlan: WorkspacePricingProducts
}) => string

export type MultiCurrencyPrice = {
  usd: string
  gbp: string
}
type MultiCurrencyProductPrice = {
  monthly: MultiCurrencyPrice
  yearly: MultiCurrencyPrice
}

export type WorkspacePlanProductAndPriceIds = Record<
  PaidWorkspacePlans,
  { productId: string } & MultiCurrencyProductPrice
>

export type GetWorkspacePlanProductAndPriceIds = () => WorkspacePlanProductAndPriceIds
export type SubscriptionDataInput = OverrideProperties<
  SubscriptionData,
  {
    products: OverrideProperties<SubscriptionProduct, { subscriptionItemId?: string }>[]
  }
>

export type ReconcileSubscriptionData = (args: {
  subscriptionData: SubscriptionDataInput
  prorationBehavior: 'always_invoice' | 'create_prorations' | 'none'
}) => Promise<void>

// Prices
export type GetRecurringPrices = () => Promise<
  {
    id: string
    currency: string
    unitAmount: number
    productId: string
  }[]
>

export type GetWorkspacePlanProductPrices = () => Promise<WorkspacePlanProductPrices>
