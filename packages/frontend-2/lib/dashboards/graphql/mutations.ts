import { graphql } from '~~/lib/common/generated/gql'

export const createDashboardMutation = graphql(`
  mutation CreateDashboard(
    $workspace: WorkspaceIdentifier!
    $input: DashboardCreateInput!
  ) {
    dashboardMutations {
      create(workspace: $workspace, input: $input) {
        id
        workspace {
          id
        }
      }
    }
  }
`)
