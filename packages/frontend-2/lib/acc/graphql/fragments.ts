import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemFragment = graphql(`
  fragment ProjectAccSyncItem on AccSyncItem {
    id
    project {
      id
    }
    model {
      id
    }
    accRegion
    accHubId
    accProjectId
    accRootProjectFolderUrn
    accFileLineageUrn
    accFileName
    accFileExtension
    accFileVersionIndex
    accFileViewName
    updatedAt
    status
    author {
      name
      avatar
    }
  }
`)
