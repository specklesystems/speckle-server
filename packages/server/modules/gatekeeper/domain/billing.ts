import {
  TrialWorkspacePlans,
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { z } from 'zod'

export type UnpaidWorkspacePlanStatuses = 'valid'

export type PaidWorkspacePlanStatuses =
  | UnpaidWorkspacePlanStatuses
  // | 'paymentNeeded' // unsure if this is needed
  | 'paymentFailed'
  | 'cancelled'

export type TrialWorkspacePlanStatuses = 'trial'

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

export const subscriptionData = z.object({
  subscriptionId: z.string().min(1),
  customerId: z.string().min(1),
  products: z
    .object({
      // we're going to use the productId to match with our
      productId: z.string(),
      subscriptionItemId: z.string(),
      priceId: z.string(),
      quantity: z.number()
    })
    .array()
})

// this abstracts the stripe sub data
export type SubscriptionData = z.infer<typeof subscriptionData>

export type SaveWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
}) => Promise<void>

export type GetSubscriptionData = (args: {
  subscriptionId: string
}) => Promise<SubscriptionData>

export type GetWorkspacePlanPrice = (args: {
  workspacePlan: WorkspacePricingPlans
  billingInterval: WorkspacePlanBillingIntervals
}) => string

export type ReconcileWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
  applyProrotation: boolean
}) => Promise<void>
