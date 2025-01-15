import { graphql } from '~~/lib/common/generated/gql'

export const searchProjectsQuery = graphql(`
  query SearchProjects(
    $search: String
    $onlyWithRoles: [String!] = null
    $workspaceId: ID
  ) {
    activeUser {
      projects(
        limit: 10
        filter: {
          search: $search
          onlyWithRoles: $onlyWithRoles
          workspaceId: $workspaceId
        }
      ) {
        totalCount
        items {
          ...FormSelectProjects_Project
        }
      }
    }
  }
`)

export const searchModelsQuery = graphql(`
  query SearchProjectModels($search: String, $projectId: String!) {
    project(id: $projectId) {
      id
      models(limit: 10, filter: { search: $search }) {
        totalCount
        items {
          ...FormSelectModels_Model
        }
      }
    }
  }
`)
