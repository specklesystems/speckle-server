import {
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from '@/modules/gatekeeper/domain/workspacePricing'

export type WorkspacePlanStatus =
  | 'trial'
  | 'valid'
  // | 'paymentNeeded' // unsure if this is needed
  | 'paymentFailed'
  | 'cancelled'

export type GetWorkspacePlan = (args: {
  workspaceId: string
}) => Promise<{ name: WorkspacePlans; status: WorkspacePlanStatus } | null>

export type CheckoutSession = {
  url: string
  id: string
  workspaceId: string
  workspacePlan: WorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
  paymentStatus: 'paid' | 'unpaid'
}

export type StoreCheckoutSession = (args: {
  checkoutSession: CheckoutSession
}) => Promise<void>

export type CreateCheckoutSession = (args: {
  workspaceId: string
  workspaceSlug: string
  seatCount: number
  guestCount: number
  workspacePlan: WorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
}) => Promise<CheckoutSession>
