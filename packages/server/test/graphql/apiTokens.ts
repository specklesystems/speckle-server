import { gql } from 'graphql-tag'

export const createTokenMutation = gql`
  mutation CreateToken($token: ApiTokenCreateInput!) {
    apiTokenCreate(token: $token)
  }
`

export const revokeTokenMutation = gql`
  mutation RevokeToken($token: String!) {
    apiTokenRevoke(token: $token)
  }
`

export const tokenAppInfoQuery = gql`
  query TokenAppInfo {
    authenticatedAsApp {
      id
      name
    }
  }
`

export const appTokenCreateMutation = gql`
  mutation AppTokenCreate($token: AppTokenCreateInput!) {
    appTokenCreate(token: $token)
  }
`
