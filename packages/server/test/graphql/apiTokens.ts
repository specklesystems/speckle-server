import { gql } from 'apollo-server-express'

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
  mutation AppTokenCreate($token: ApiTokenCreateInput!) {
    appTokenCreate(token: $token)
  }
`
