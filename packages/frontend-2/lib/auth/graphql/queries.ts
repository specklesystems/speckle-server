import { graphql } from '~~/lib/common/generated/gql'

export const loginServerInfoQuery = graphql(`
  query AuthServerInfo {
    serverInfo {
      ...AuthStategiesServerInfoFragment
      ...ServerTermsOfServicePrivacyPolicyFragment
    }
  }
`)
