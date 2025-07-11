import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemFragment = graphql(`
  fragment ProjectAccSyncItem on AccSyncItem {
    id
    projectId
    modelId
    accHubId
    accProjectId
    accRootFolderUrn
    accFileLineageId
    updatedAt
    status
    author {
      name
      avatar
    }
  }
`)
