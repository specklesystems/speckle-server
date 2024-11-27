import { graphql } from '~~/lib/common/generated/gql'

export const billingUpgradePlanRedirectMutation = graphql(`
  mutation BillingUpgradePlanRedirect($input: CheckoutSessionInput!) {
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
