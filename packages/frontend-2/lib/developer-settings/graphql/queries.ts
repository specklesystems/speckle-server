import { graphql } from '~~/lib/common/generated/gql'

export const developerSettingsAccessTokensQuery = graphql(`
  query DeveloperSettingsAccessTokens {
    activeUser {
      id
      apiTokens {
        id
        name
        lastUsed
        lastChars
        createdAt
        scopes
      }
    }
  }
`)
