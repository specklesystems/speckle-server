import { graphql } from '~~/lib/common/generated/gql'

export const finishOnboardingMutation = graphql(`
  mutation FinishOnboarding {
    activeUserMutations {
      finishOnboarding
    }
  }
`)

export const requestVerificationByEmailMutation = graphql(`
  mutation RequestVerificationByEmail($email: String!) {
    requestVerificationByEmail(email: $email)
  }
`)
