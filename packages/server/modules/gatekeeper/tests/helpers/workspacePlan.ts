import { WorkspaceFeatureFlags, type WorkspacePlan } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash-es'
import type {
  SubscriptionData,
  SubscriptionProduct,
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
      status: 'valid',
      featureFlags: WorkspaceFeatureFlags.none
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
      updateIntent: {},
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

export const buildTestSubscriptionProduct = (
  overrides?: Partial<SubscriptionProduct>
): SubscriptionProduct =>
  assign(
    {
      productId: cryptoRandomString({ length: 10 }),
      subscriptionItemId: cryptoRandomString({ length: 10 }),
      priceId: cryptoRandomString({ length: 10 }),
      quantity: 1
    },
    overrides
  )
