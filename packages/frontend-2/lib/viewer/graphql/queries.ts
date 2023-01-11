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

export const viewerModelCardsQuery = graphql(`
  query ViewerModelCards(
    $projectId: String!
    $modelIds: [String!]!
    $versionIds: [String!]
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
    }
  }
`)
