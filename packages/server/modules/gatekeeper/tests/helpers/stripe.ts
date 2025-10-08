import type Stripe from 'stripe'

export const buildFakeStripe = (updates: Record<string, unknown> = {}): Stripe => {
  return {
    subscriptions: {
      update: async (subscriptionId: string, params?: unknown) => {
        updates[subscriptionId] = params
      }
    }
  } as unknown as Stripe
}
