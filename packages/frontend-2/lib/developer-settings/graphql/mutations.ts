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

export const deleteApplicationMutation = graphql(`
  mutation deleteApplication($appId: String!) {
    appDelete(appId: $appId)
  }
`)

export const createApplicationMutation = graphql(`
  mutation createApplication($app: AppCreateInput!) {
    appCreate(app: $app)
  }
`)

export const editApplicationMutation = graphql(`
  mutation editApplication($app: AppUpdateInput!) {
    appUpdate(app: $app)
  }
`)
