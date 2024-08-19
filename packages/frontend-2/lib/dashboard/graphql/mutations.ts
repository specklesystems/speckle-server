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
