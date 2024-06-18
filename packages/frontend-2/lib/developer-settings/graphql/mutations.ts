import { graphql } from '~~/lib/common/generated/gql'

export const deleteAccessTokenMutation = graphql(`
  mutation DeleteAccessToken($token: String!) {
    apiTokenRevoke(token: $token)
  }
`)

export const createAccessTokenMutation = graphql(`
  mutation CreateAccessToken($token: ApiTokenCreateInput!) {
    apiTokenCreate(token: $token)
  }
`)

export const deleteApplicationMutation = graphql(`
  mutation DeleteApplication($appId: String!) {
    appDelete(appId: $appId)
  }
`)

export const createApplicationMutation = graphql(`
  mutation CreateApplication($app: AppCreateInput!) {
    appCreate(app: $app)
  }
`)

export const editApplicationMutation = graphql(`
  mutation EditApplication($app: AppUpdateInput!) {
    appUpdate(app: $app)
  }
`)

export const revokeAppAccessMutation = graphql(`
  mutation RevokeAppAccess($appId: String!) {
    appRevokeAccess(appId: $appId)
  }
`)
