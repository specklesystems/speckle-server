import { graphql } from '~~/lib/common/generated/gql'

export const projectViewerResourcesQuery = graphql(`
  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {
    project(id: $projectId) {
      id
      viewerResources(resourceIdString: $resourceUrlString) {
        identifier
        items {
          modelId
          versionId
          objectId
        }
      }
    }
  }
`)

/**
 * Query to load all metadata needed for loaded models (& their versions) in the viewer, for
 * all sidebar panels and everything
 */
export const viewerLoadedResourcesQuery = graphql(`
  query ViewerLoadedResources(
    $projectId: String!
    $modelIds: [String!]!
    $versionIds: [String!]
    $resourceIdString: String!
  ) {
    project(id: $projectId) {
      id
      models(filter: { ids: $modelIds }) {
        totalCount
        items {
          id
          name
          updatedAt
          versions(filter: { priorityIds: $versionIds }) {
            totalCount
            items {
              ...ViewerModelVersionCardItem
            }
          }
        }
      }
      commentThreads(filter: { resourceIdString: $resourceIdString }) {
        totalCount
        items {
          ...ViewerCommentsListItem
          ...ViewerCommentBubblesData
        }
      }
      ...ModelPageProject
    }
  }
`)
