import { graphql } from '~~/lib/common/generated/gql'

export const dashboardRequestToJoinWorkspaceMutation = graphql(`
  mutation DashboardRequestToJoinWorkspace($input: WorkspaceRequestToJoinInput!) {
    workspaceMutations {
      requestToJoin(input: $input)
    }
  }
`)
