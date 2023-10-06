import { graphql } from '~~/lib/common/generated/gql'

export const updateAccessTokenMutation = graphql(`
  mutation UpdateAccessTokens($user: UserUpdateInput!) {
    activeUserMutations {
      update(user: $user) {
        id
        apiTokens {
          name
          id
          scopes
        }
      }
    }
  }
`)

export const deleteAccessTokenMutation = graphql(`
  mutation deleteAccessToken($token: String!) {
    apiTokenRevoke(token: $token)
  }
`)

export const createAccessTokenMutation = graphql(`
  mutation createAccessToken($token: ApiTokenCreateInput!) {
    apiTokenCreate(token: $token)
  }
`)
