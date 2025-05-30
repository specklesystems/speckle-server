import { WorkspacePlan } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash'
import {
  SubscriptionData,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'

export const buildTestWorkspacePlan = (
  overrides?: Partial<WorkspacePlan>
): WorkspacePlan =>
  assign(
    {
      workspaceId: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'free',
      status: 'valid'
    },
    overrides
  )

export const buildTestWorkspaceSubscription = (
  overrides?: Partial<WorkspaceSubscription>
): WorkspaceSubscription =>
  assign(
    {
      workspaceId: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentBillingCycleEnd: new Date(),
      billingInterval: 'monthly',
      currency: 'usd',
      subscriptionData: buildTestSubscriptionData()
    },
    overrides
  )

export const buildTestSubscriptionData = (
  overrides?: Partial<SubscriptionData>
): SubscriptionData =>
  assign(
    {
      subscriptionId: cryptoRandomString({ length: 10 }),
      customerId: cryptoRandomString({ length: 10 }),
      cancelAt: new Date(),
      status: 'active',
      products: [],
      currentPeriodEnd: new Date()
    },
    overrides
  )
