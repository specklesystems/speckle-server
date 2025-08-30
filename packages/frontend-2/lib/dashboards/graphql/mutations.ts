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

export const updateDashboardMutation = graphql(`
  mutation UpdateDashboard($input: DashboardUpdateInput!) {
    dashboardMutations {
      update(input: $input) {
        id
        name
      }
    }
  }
`)

export const deleteDashboardMutation = graphql(`
  mutation DeleteDashboard($id: String!) {
    dashboardMutations {
      delete(id: $id)
    }
  }
`)
