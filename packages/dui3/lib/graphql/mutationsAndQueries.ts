import { graphql } from '~~/lib/common/generated/gql'

export const createVersionMutation = graphql(`
  mutation VersionMutations($input: CreateVersionInput!) {
    versionMutations {
      create(input: $input) {
        id
      }
    }
  }
`)

export const markReceivedVersionMutation = graphql(`
  mutation MarkReceivedVersion($input: MarkReceivedVersionInput!) {
    versionMutations {
      markReceived(input: $input)
    }
  }
`)

export const createModelMutation = graphql(`
  mutation CreateModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        ...ModelListModelItem
      }
    }
  }
`)

export const createProjectMutation = graphql(`
  mutation CreateProject($input: ProjectCreateInput) {
    projectMutations {
      create(input: $input) {
        ...ProjectListProjectItem
      }
    }
  }
`)

export const requestProjectAccess = graphql(`
  mutation StreamAccessRequestCreate($input: String!) {
    streamAccessRequestCreate(streamId: $input) {
      id
    }
  }
`)

export const projectListFragment = graphql(`
  fragment ProjectListProjectItem on Project {
    id
    name
    role
    updatedAt
    models {
      totalCount
    }
  }
`)

export const projectsListQuery = graphql(`
  query ProjectListQuery($limit: Int!, $filter: UserProjectsFilter, $cursor: String) {
    activeUser {
      id
      projects(limit: $limit, filter: $filter, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...ProjectListProjectItem
        }
      }
    }
  }
`)

export const modelListFragment = graphql(`
  fragment ModelListModelItem on Model {
    displayName
    name
    id
    previewUrl
    updatedAt
    versions(limit: 1) {
      totalCount
      items {
        ...VersionListItem
      }
    }
  }
`)

export const projectModelsQuery = graphql(`
  query ProjectModels(
    $projectId: String!
    $cursor: String
    $limit: Int!
    $filter: ProjectModelsFilter
  ) {
    project(id: $projectId) {
      id
      models(cursor: $cursor, limit: $limit, filter: $filter) {
        totalCount
        cursor
        items {
          ...ModelListModelItem
        }
      }
    }
  }
`)

export const versionListFragment = graphql(`
  fragment VersionListItem on Version {
    id
    referencedObject
    message
    sourceApplication
    authorUser {
      avatar
      id
      name
    }
    createdAt
    previewUrl
  }
`)

export const modelVersionsQuery = graphql(`
  query ModelVersions(
    $modelId: String!
    $projectId: String!
    $limit: Int!
    $cursor: String
    $filter: ModelVersionsFilter
  ) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        versions(limit: $limit, cursor: $cursor, filter: $filter) {
          totalCount
          cursor
          items {
            ...VersionListItem
          }
        }
      }
    }
  }
`)

export const projectAddByUrlQueryWithVersion = graphql(`
  query ProjectAddByUrlQueryWithVersion(
    $projectId: String!
    $modelId: String!
    $versionId: String!
  ) {
    project(id: $projectId) {
      ...ProjectListProjectItem
      model(id: $modelId) {
        ...ModelListModelItem
        version(id: $versionId) {
          ...VersionListItem
        }
      }
    }
  }
`)

export const projectAddByUrlQueryWithoutVersion = graphql(`
  query ProjectAddByUrlQueryWithoutVersion($projectId: String!, $modelId: String!) {
    project(id: $projectId) {
      ...ProjectListProjectItem
      model(id: $modelId) {
        ...ModelListModelItem
      }
    }
  }
`)

export const projectDetailsQuery = graphql(`
  query ProjectDetails($projectId: String!) {
    project(id: $projectId) {
      id
      role
      name
      team {
        user {
          avatar
          id
          name
        }
      }
      visibility
    }
  }
`)

export const modelDetailsQuery = graphql(`
  query ModelDetails($modelId: String!, $projectId: String!) {
    project(id: $projectId) {
      id
      name
      model(id: $modelId) {
        id
        displayName
        name
        versions {
          totalCount
        }
        author {
          id
          name
          avatar
        }
      }
    }
  }
`)

export const versionDetailsQuery = graphql(`
  query VersionDetails($projectId: String!, $versionId: String!, $modelId: String!) {
    project(id: $projectId) {
      id
      name
      model(id: $modelId) {
        id
        name
        versions(limit: 1) {
          items {
            id
            createdAt
          }
        }
        version(id: $versionId) {
          id
          referencedObject
          message
          sourceApplication
          createdAt
          previewUrl
        }
      }
    }
  }
`)

export const versionCreatedSubscription = graphql(`
  subscription OnProjectVersionsUpdate($projectId: String!) {
    projectVersionsUpdated(id: $projectId) {
      id
      type
      version {
        id
        createdAt
        message
        sourceApplication
        authorUser {
          id
          name
          avatar
        }
        model {
          id
          name
          displayName
        }
      }
    }
  }
`)

export const userProjectsUpdatedSubscription = graphql(`
  subscription OnUserProjectsUpdated {
    userProjectsUpdated {
      id
      project {
        id
        visibility
        team {
          id
          role
        }
      }
    }
  }
`)

export const projectUpdatedSubscription = graphql(`
  subscription ProjectUpdated($projectId: String!) {
    projectUpdated(id: $projectId) {
      id
      project {
        visibility
      }
    }
  }
`)

export const modelViewingSubscription = graphql(`
  subscription Subscription($target: ViewerUpdateTrackingTarget!) {
    viewerUserActivityBroadcasted(target: $target) {
      userName
      userId
      sessionId
      user {
        name
        id
        avatar
      }
      status
    }
  }
`)

export const modelCommentCreatedSubscription = graphql(`
  subscription ProjectCommentsUpdated($target: ViewerUpdateTrackingTarget!) {
    projectCommentsUpdated(target: $target) {
      comment {
        author {
          avatar
          id
          name
        }
        id
        hasParent
        parent {
          id
        }
      }
      type
    }
  }
`)
