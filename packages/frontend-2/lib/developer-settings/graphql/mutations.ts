import { graphql } from '~~/lib/common/generated/gql'

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
