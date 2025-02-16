import { graphql } from '~/lib/common/generated/gql'

export const PagesOnboardingDiscoverableWorkspaces = graphql(`
  query PagesOnboardingDiscoverableWorkspaces_ActiveUser {
    activeUser {
      id
      ...PagesOnboarding_DiscoverableWorkspaces
    }
  }
`)
