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
  ) {
    project(id: $projectId) {
      id
      role
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
      ...ModelPageProject
    }
  }
`)

export const viewerLoadedThreadsQuery = graphql(`
  query ViewerLoadedThreads(
    $projectId: String!
    $filter: ProjectCommentsFilter!
    $cursor: String
    $limit: Int = 25
  ) {
    project(id: $projectId) {
      id
      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {
        totalCount
        items {
          ...ViewerCommentThread
        }
      }
    }
  }
`)
