import { graphql } from '~~/lib/common/generated/gql'

export const billingCreateCheckoutSessionMutation = graphql(`
  mutation BillingCreateCheckoutSession($input: CheckoutSessionInput!) {
    workspaceMutations {
      billing {
        createCheckoutSession(input: $input) {
          url
          id
        }
      }
    }
  }
`)

export const billingUpgradePlanMuation = graphql(`
  mutation BillingUpgradePlan($input: UpgradePlanInput!) {
    workspaceMutations {
      billing {
        upgradePlan(input: $input)
      }
    }
  }
`)
