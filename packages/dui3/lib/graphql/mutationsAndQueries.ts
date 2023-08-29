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

export const projectsListQuery = graphql(`
  query ProjectsList($query: String, $limit: Int, $cursor: String) {
    streams(query: $query, limit: $limit, cursor: $cursor) {
      totalCount
      cursor
      items {
        id
        name
      }
    }
  }
`)

export const projectModelsQuery = graphql(`
  query ProjectModels($projectId: String!, $filter: String, $cursor: String) {
    project(id: $projectId) {
      id
      name
      models(cursor: $cursor, filter: $filter) {
        items {
          id
          name
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
