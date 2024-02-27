import { graphql } from '~~/lib/common/generated/gql'

export const createCommitMutation = graphql(`
  mutation CommitCreate($commit: CommitCreateInput!) {
    commitCreate(commit: $commit)
  }
`)

export const createVersionMutation = graphql(`
  mutation CreateVersion($input: VersionCreateInput!) {
    versionMutations {
      create(input: $input) {
        id
        message
        referencedObject
      }
    }
  }
`)

export const createModelMutation = graphql(`
  mutation CreateModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        id
        name
      }
    }
  }
`)

export const createProjectMutation = graphql(`
  mutation CreateProject($input: ProjectCreateInput) {
    projectMutations {
      create(input: $input) {
        id
        name
      }
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
    versions {
      totalCount
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
