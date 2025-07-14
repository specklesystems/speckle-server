import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemFragment = graphql(`
  fragment ProjectAccSyncItem on AccSyncItem {
    id
    projectId
    modelId
    accRegion
    accHubId
    accProjectId
    accRootProjectFolderId
    accFileLineageId
    accFileName
    accFileExtension
    updatedAt
    status
    author {
      name
      avatar
    }
  }
`)
