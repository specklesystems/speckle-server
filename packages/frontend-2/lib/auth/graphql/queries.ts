import { graphql } from '~~/lib/common/generated/gql'

export const loginServerInfoQuery = graphql(`
  query AuthServerInfo {
    serverInfo {
      ...AuthStategiesServerInfoFragment
      ...ServerTermsOfServicePrivacyPolicyFragment
      ...AuthRegisterPanelServerInfo
    }
  }
`)

export const authorizableAppMetadataQuery = graphql(`
  query AuthorizableAppMetadata($id: String!) {
    app(id: $id) {
      id
      name
      description
      trustByDefault
      redirectUrl
      scopes {
        name
        description
      }
      author {
        name
        id
        avatar
      }
    }
  }
`)
