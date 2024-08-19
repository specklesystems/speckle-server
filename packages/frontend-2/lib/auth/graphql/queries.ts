import { graphql } from '~~/lib/common/generated/gql'

export const authLoginPanelQuery = graphql(`
  query AuthLoginPanel {
    serverInfo {
      authStrategies {
        id
      }
      ...AuthStategiesServerInfoFragment
    }
  }
`)

export const authLoginPanelWorkspaceInviteQuery = graphql(`
  query AuthLoginPanelWorkspaceInvite($token: String) {
    workspaceInvite(token: $token) {
      id
      email
      ...AuthWorkspaceInviteHeader_PendingWorkspaceCollaborator
      ...AuthLoginWithEmailBlock_PendingWorkspaceCollaborator
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
