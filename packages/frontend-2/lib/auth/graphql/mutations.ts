import { graphql } from '~~/lib/common/generated/gql'

export const finishOnboardingMutation = graphql(`
  mutation FinishOnboarding {
    activeUserMutations {
      finishOnboarding
    }
  }
`)
