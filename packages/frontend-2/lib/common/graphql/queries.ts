import { graphql } from '~~/lib/common/generated/gql'

export const mentionsUserSearchQuery = graphql(`
  query MentionsUserSearch($query: String!, $projectId: String) {
    users(input: { query: $query, limit: 5, cursor: null, projectId: $projectId }) {
      items {
        id
        name
        company
      }
    }
  }
`)

export const userSearchQuery = graphql(`
  query UserSearch(
    $query: String!
    $limit: Int
    $cursor: String
    $archived: Boolean
    $workspaceId: String
  ) {
    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {
      cursor
      items {
        id
        name
        bio
        company
        avatar
        verified
        role
        workspaceDomainPolicyCompliant(workspaceId: $workspaceId)
      }
    }
  }
`)

export const serverInfoBlobSizeLimitQuery = graphql(`
  query ServerInfoBlobSizeLimit {
    serverInfo {
      configuration {
        blobSizeLimitBytes
      }
    }
  }
`)

export const serverInfoAllScopesQuery = graphql(`
  query ServerInfoAllScopes {
    serverInfo {
      scopes {
        name
        description
      }
    }
  }
`)

export const projectModelsSelectorValuesQuery = graphql(`
  query ProjectModelsSelectorValues($projectId: String!, $cursor: String) {
    project(id: $projectId) {
      id
      models(limit: 100, cursor: $cursor) {
        cursor
        totalCount
        items {
          ...CommonModelSelectorModel
        }
      }
    }
  }
`)
