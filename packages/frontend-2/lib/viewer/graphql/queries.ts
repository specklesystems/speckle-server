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
      allowPublicComments
      models(filter: { ids: $modelIds }) {
        totalCount
        items {
          id
          name
          updatedAt
          loadedVersion: versions(
            filter: { priorityIds: $versionIds, priorityIdsOnly: true }
          ) {
            items {
              ...ViewerModelVersionCardItem
              automationsStatus {
                id
                automationRuns {
                  ...AutomateViewerPanel_AutomateRun
                }
              }
            }
          }
          versions(limit: 5) {
            totalCount
            cursor
            items {
              ...ViewerModelVersionCardItem
            }
          }
        }
      }
      ...ProjectPageLatestItemsModels
      ...ModelPageProject
      ...HeaderNavShare_Project
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
    $versionsCursor: String
  ) {
    project(id: $projectId) {
      id
      role
      model(id: $modelId) {
        id
        versions(cursor: $versionsCursor, limit: 5) {
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

export const viewerDiffVersionsQuery = graphql(`
  query ViewerDiffVersions(
    $projectId: String!
    $modelId: String!
    $versionAId: String!
    $versionBId: String!
  ) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        versionA: version(id: $versionAId) {
          ...ViewerModelVersionCardItem
        }
        versionB: version(id: $versionBId) {
          ...ViewerModelVersionCardItem
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
    $limit: Int
  ) {
    project(id: $projectId) {
      id
      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {
        totalCount
        totalArchivedCount
        items {
          ...ViewerCommentThread
          ...LinkableComment
        }
      }
    }
  }
`)

export const viewerRawObjectQuery = graphql(`
  query ViewerRawProjectObject($projectId: String!, $objectId: String!) {
    project(id: $projectId) {
      id
      object(id: $objectId) {
        id
        data
      }
    }
  }
`)
