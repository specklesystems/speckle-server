import { graphql } from '~~/lib/common/generated/gql'

export const finishOnboardingMutation = graphql(`
  mutation FinishOnboarding($input: OnboardingCompletionInput) {
    activeUserMutations {
      finishOnboarding(input: $input)
    }
  }
`)

export const requestVerificationByEmailMutation = graphql(`
  mutation RequestVerificationByEmail($email: String!) {
    requestVerificationByEmail(email: $email)
  }
`)
