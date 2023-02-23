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
          versions(filter: { priorityIds: $versionIds }, limit: 10) {
            totalCount
            cursor
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

/**
 * Note: The Model.versions query must be exactly the same as the one in `ViewerLoadedResources` for
 * automatic cache updates to work properly
 */
export const viewerModelVersionsQuery = graphql(`
  query ViewerModelVersions(
    $projectId: String!
    $modelId: String!
    $priorityVersionIds: [String!]
    $versionsCursor: String
  ) {
    project(id: $projectId) {
      id
      role
      model(id: $modelId) {
        id
        versions(
          filter: { priorityIds: $priorityVersionIds }
          cursor: $versionsCursor
          limit: 10
        ) {
          totalCount
          cursor
          items {
            ...ViewerModelVersionCardItem
          }
        }
      }
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
        totalArchivedCount
        items {
          ...ViewerCommentThread
        }
      }
    }
  }
`)
