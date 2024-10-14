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

export type WorkspacePlan = {
  workspaceId: string
  name: WorkspacePlans
  status: WorkspacePlanStatus
}

export type GetWorkspacePlan = (args: {
  workspaceId: string
}) => Promise<WorkspacePlan | null>

export type UpsertWorkspacePlan = (args: {
  workspacePlan: WorkspacePlan
}) => Promise<void>

export type SessionInput = {
  id: string
  paymentStatus: 'paid' | 'unpaid'
}

export type CheckoutSession = SessionInput & {
  url: string
  workspaceId: string
  workspacePlan: WorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
}

export type SaveCheckoutSession = (args: {
  checkoutSession: CheckoutSession
}) => Promise<void>

export type GetCheckoutSession = (args: {
  sessionId: string
}) => Promise<CheckoutSession | null>

export type CreateCheckoutSession = (args: {
  workspaceId: string
  workspaceSlug: string
  seatCount: number
  guestCount: number
  workspacePlan: WorkspacePlans
  billingInterval: WorkspacePlanBillingIntervals
}) => Promise<CheckoutSession>
