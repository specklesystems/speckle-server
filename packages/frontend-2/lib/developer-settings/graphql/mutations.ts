import { graphql } from '~~/lib/common/generated/gql'

export const DeleteAccessTokenMutation = graphql(`
  mutation deleteAccessToken($token: String!) {
    apiTokenRevoke(token: $token)
  }
`)

export const CreateAccessTokenMutation = graphql(`
  mutation createAccessToken($token: ApiTokenCreateInput!) {
    apiTokenCreate(token: $token)
  }
`)

export const DeleteApplicationMutation = graphql(`
  mutation deleteApplication($appId: String!) {
    appDelete(appId: $appId)
  }
`)

export const CreateApplicationMutation = graphql(`
  mutation createApplication($app: AppCreateInput!) {
    appCreate(app: $app)
  }
`)

export const EditApplicationMutation = graphql(`
  mutation editApplication($app: AppUpdateInput!) {
    appUpdate(app: $app)
  }
`)
