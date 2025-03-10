import {
  PaidWorkspacePlan,
  TrialWorkspacePlan,
  UnpaidWorkspacePlan,
  WorkspacePlan,
  WorkspacePlanProductPrices,
  WorkspacePricingProducts
} from '@/modules/gatekeeperCore/domain/billing'
import { PaidWorkspacePlans, WorkspacePlanBillingIntervals } from '@speckle/shared'
import { OverrideProperties } from 'type-fest'
import { z } from 'zod'

export type GetWorkspacePlan = (args: {
  workspaceId: string
}) => Promise<WorkspacePlan | null>

export type UpsertTrialWorkspacePlan = (args: {
  workspacePlan: TrialWorkspacePlan
}) => Promise<void>

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
  workspacePlan: PaidWorkspacePlans
  paymentStatus: SessionPaymentStatus
  billingInterval: WorkspacePlanBillingIntervals
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

// Remove with FF_WORKSPACES_NEW_PLANS_ENABLED
export type CreateCheckoutSessionOld = (args: {
  workspaceId: string
  workspaceSlug: string
  seatCount: number
  guestCount: number
  workspacePlan: PaidWorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
  isCreateFlow: boolean
}) => Promise<CheckoutSession>
export type CreateCheckoutSession = (args: {
  workspaceId: string
  workspaceSlug: string
  editorsCount: number
  viewersCount: number
  workspacePlan: PaidWorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
  isCreateFlow: boolean
}) => Promise<CheckoutSession>

export type WorkspaceSubscription = {
  workspaceId: string
  createdAt: Date
  updatedAt: Date
  currentBillingCycleEnd: Date
  billingInterval: WorkspacePlanBillingIntervals
  subscriptionData: SubscriptionData
}
const subscriptionProduct = z.object({
  productId: z.string(),
  subscriptionItemId: z.string(),
  priceId: z.string(),
  quantity: z.number()
})

export type SubscriptionProduct = z.infer<typeof subscriptionProduct>

export const subscriptionData = z.object({
  subscriptionId: z.string().min(1),
  customerId: z.string().min(1),
  cancelAt: z.date().nullable(),
  status: z.union([
    z.literal('incomplete'),
    z.literal('incomplete_expired'),
    z.literal('trialing'),
    z.literal('active'),
    z.literal('past_due'),
    z.literal('canceled'),
    z.literal('unpaid'),
    z.literal('paused')
  ]),
  products: subscriptionProduct.array()
})

export const calculateSubscriptionSeats = ({
  subscriptionData,
  guestSeatProductId
}: {
  subscriptionData: SubscriptionData
  guestSeatProductId: string
}): { plan: number; guest: number } => {
  const guestProduct = subscriptionData.products.find(
    (p) => p.productId === guestSeatProductId
  )

  const planProduct = subscriptionData.products.find(
    (p) => p.productId !== guestSeatProductId
  )
  return { guest: guestProduct?.quantity || 0, plan: planProduct?.quantity || 0 }
}

// this abstracts the stripe sub data
export type SubscriptionData = z.infer<typeof subscriptionData>

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

export type GetSubscriptionData = (args: {
  subscriptionId: string
}) => Promise<SubscriptionData>

export type GetWorkspacePlanPriceId = (args: {
  workspacePlan: WorkspacePricingProducts
  billingInterval: WorkspacePlanBillingIntervals
}) => string

export type GetWorkspacePlanProductId = (args: {
  workspacePlan: WorkspacePricingProducts
}) => string

type Products = 'guest' | 'starter' | 'plus' | 'business' | 'viewer' | 'team' | 'pro'

export type GetWorkspacePlanProductAndPriceIds = () => Omit<
  Record<Products, { productId: string; monthly: string; yearly: string }>,
  'viewer' | 'team' | 'pro'
> & {
  team?: { productId: string; monthly: string }
  pro?: { productId: string; monthly: string; yearly: string }
  viewer?: { productId: string; monthly: string; yearly: string }
}

export type SubscriptionDataInput = OverrideProperties<
  SubscriptionData,
  {
    products: OverrideProperties<SubscriptionProduct, { subscriptionItemId?: string }>[]
  }
>

export type ReconcileSubscriptionData = (args: {
  subscriptionData: SubscriptionDataInput
  applyProrotation: boolean
}) => Promise<void>

export const WorkspaceSeatType = <const>{
  Viewer: 'viewer',
  Editor: 'editor'
}
export type WorkspaceSeatType =
  (typeof WorkspaceSeatType)[keyof typeof WorkspaceSeatType]

export type WorkspaceSeat = {
  workspaceId: string
  userId: string
  type: WorkspaceSeatType
  createdAt: Date
  updatedAt: Date
}
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
