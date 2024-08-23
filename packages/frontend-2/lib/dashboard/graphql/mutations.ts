import { graphql } from '~~/lib/common/generated/gql'

export const dashboardJoinWorkspaceMutation = graphql(`
  mutation DashboardJoinWorkspace($input: JoinWorkspaceInput!) {
    workspaceMutations {
      join(input: $input) {
        ...WorkspaceInviteDiscoverableWorkspaceBanner_Workspace
      }
    }
  }
`)
