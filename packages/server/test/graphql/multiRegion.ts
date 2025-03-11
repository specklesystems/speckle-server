import gql from 'graphql-tag'

export const mainRegionMetadataFragment = gql`
  fragment MainRegionMetadata on ServerRegionItem {
    id
    key
    name
    description
  }
`

export const getAvailableRegionKeysQuery = gql`
  query GetAvailableRegionKeys {
    serverInfo {
      multiRegion {
        availableKeys
      }
    }
  }
`

export const createRegionMutation = gql`
  mutation CreateNewRegion($input: CreateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        create(input: $input) {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`

export const getRegionsQuery = gql`
  query GetRegions {
    serverInfo {
      multiRegion {
        regions {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`

export const updateRegionMutation = gql`
  mutation UpdateRegion($input: UpdateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        update(input: $input) {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`

export const updateProjectRegionMutation = gql`
  mutation UpdateProjectRegion($projectId: String!, $regionKey: String!) {
    workspaceMutations {
      projects {
        moveToRegion(projectId: $projectId, regionKey: $regionKey)
      }
    }
  }
`

/** Queries for regional project data */

export const getRegionalProjectModelQuery = gql`
  query GetRegionalProjectModel($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        name
      }
    }
  }
`

export const getRegionalProjectVersionQuery = gql`
  query GetRegionalProjectVersion(
    $projectId: String!
    $modelId: String!
    $versionId: String!
  ) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        version(id: $versionId) {
          id
          referencedObject
        }
      }
    }
  }
`

export const getRegionalProjectObjectQuery = gql`
  query GetRegionalProjectObject($projectId: String!, $objectId: String!) {
    project(id: $projectId) {
      id
      object(id: $objectId) {
        id
      }
    }
  }
`

export const getRegionalProjectAutomationQuery = gql`
  query GetRegionalProjectAutomation($projectId: String!, $automationId: String!) {
    project(id: $projectId) {
      id
      automation(id: $automationId) {
        id
        runs {
          items {
            id
            functionRuns {
              id
              status
            }
          }
        }
      }
    }
  }
`

export const getRegionalProjectCommentQuery = gql`
  query GetRegionalProjectComment($projectId: String!, $commentId: String!) {
    project(id: $projectId) {
      id
      comment(id: $commentId) {
        id
      }
    }
  }
`

export const getRegionalProjectWebhookQuery = gql`
  query GetRegionalProjectWebhook($projectId: String!, $webhookId: String!) {
    project(id: $projectId) {
      id
      webhooks(id: $webhookId) {
        items {
          id
        }
      }
    }
  }
`

export const getRegionalProjectBlobQuery = gql`
  query GetRegionalProjectBlob($projectId: String!, $blobId: String!) {
    project(id: $projectId) {
      id
      blob(id: $blobId) {
        id
        fileName
      }
    }
  }
`
