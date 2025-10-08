import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemFragment = graphql(`
  fragment ProjectAccSyncItem on AccSyncItem {
    id
    project {
      id
      name
    }
    model {
      id
      name
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
