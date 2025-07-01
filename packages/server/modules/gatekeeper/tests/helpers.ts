import {
  SubscriptionData,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash-es'

export const createTestSubscriptionData = (
  overrides: Partial<SubscriptionData> = {}
): SubscriptionData => {
  const aMonthFromNow = new Date()
  aMonthFromNow.setMonth(new Date().getMonth() + 1)
  const defaultValues = {
    cancelAt: null,
    customerId: cryptoRandomString({ length: 10 }),
    products: [
      {
        priceId: cryptoRandomString({ length: 10 }),
        productId: cryptoRandomString({ length: 10 }),
        quantity: 3,
        subscriptionItemId: cryptoRandomString({ length: 10 })
      }
    ],
    status: 'active',
    subscriptionId: cryptoRandomString({ length: 10 }),
    currentPeriodEnd: aMonthFromNow.toISOString()
  }
  return assign(defaultValues, overrides)
}

export const createTestWorkspaceSubscription = (
  overrides: Partial<WorkspaceSubscription> = {}
): WorkspaceSubscription => {
  const defaultValues: WorkspaceSubscription = {
    billingInterval: 'monthly',
    createdAt: new Date(),
    updatedAt: new Date(),
    currentBillingCycleEnd: new Date(),
    subscriptionData: createTestSubscriptionData(),
    updateIntent: null,
    currency: 'usd',
    workspaceId: cryptoRandomString({ length: 10 })
  }
  return assign(defaultValues, overrides)
}
