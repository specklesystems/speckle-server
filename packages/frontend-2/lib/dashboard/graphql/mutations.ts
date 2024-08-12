import { graphql } from '~~/lib/common/generated/gql'

export const dashboardJoinWorkspaceMutation = graphql(`
  mutation DashboardJoinWorkspaceQuery($input: JoinWorkspaceInput!) {
    workspaceMutations {
      join(input: $input) {
        id
      }
    }
  }
`)

export const dashboardProjectsPageQuery = graphql(`
  query DashboardProjectsPageQuery {
    activeUser {
      id
      projects(limit: 3) {
        items {
          ...DashboardProjectCard_Project
        }
      }
    }
  }
`)
