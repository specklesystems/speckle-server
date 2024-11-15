import {
  TrialWorkspacePlans,
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { OverrideProperties } from 'type-fest'
import { z } from 'zod'

export type UnpaidWorkspacePlanStatuses = 'valid'

export type PaidWorkspacePlanStatuses =
  | UnpaidWorkspacePlanStatuses
  // | 'paymentNeeded' // unsure if this is needed
  | 'paymentFailed'
  | 'cancelationScheduled'
  | 'canceled'

export type TrialWorkspacePlanStatuses = 'trial' | 'expired'

export type PlanStatuses =
  | PaidWorkspacePlanStatuses
  | TrialWorkspacePlanStatuses
  | UnpaidWorkspacePlanStatuses

type BaseWorkspacePlan = {
  workspaceId: string
}

export type PaidWorkspacePlan = BaseWorkspacePlan & {
  name: PaidWorkspacePlans
  status: PaidWorkspacePlanStatuses
}

export type TrialWorkspacePlan = BaseWorkspacePlan & {
  name: TrialWorkspacePlans
  status: TrialWorkspacePlanStatuses
}

export type UnpaidWorkspacePlan = BaseWorkspacePlan & {
  name: UnpaidWorkspacePlans
  status: UnpaidWorkspacePlanStatuses
}

export type WorkspacePlan = PaidWorkspacePlan | TrialWorkspacePlan | UnpaidWorkspacePlan

export type GetWorkspacePlan = (args: {
  workspaceId: string
}) => Promise<WorkspacePlan | null>

export type UpsertTrialWorkspacePlan = (args: {
  workspacePlan: TrialWorkspacePlan
}) => Promise<void>

export type UpsertPaidWorkspacePlan = (args: {
  workspacePlan: PaidWorkspacePlan
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

export type CreateCheckoutSession = (args: {
  workspaceId: string
  workspaceSlug: string
  seatCount: number
  guestCount: number
  workspacePlan: PaidWorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
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

export type GetWorkspacePlanPrice = (args: {
  workspacePlan: WorkspacePricingPlans
  billingInterval: WorkspacePlanBillingIntervals
}) => string

export type GetWorkspacePlanProductId = (args: {
  workspacePlan: WorkspacePricingPlans
}) => string

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
