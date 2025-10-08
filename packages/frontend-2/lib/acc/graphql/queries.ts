import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemsQuery = graphql(`
  query ProjectAccSyncItems($id: String!) {
    project(id: $id) {
      accSyncItems {
        items {
          ...ProjectAccSyncItem
        }
      }
    }
  }
`)

export const accFolderDataQuery = graphql(`
  query AccFolderData(
    $workspaceSlug: String!
    $accToken: String!
    $accProjectId: String!
    $accFolderId: String!
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      id
      integrations {
        acc(token: $accToken) {
          folder(projectId: $accProjectId, folderId: $accFolderId) {
            id
            ...AccIntegrationFolderNode_AccFolder
          }
        }
      }
    }
  }
`)
