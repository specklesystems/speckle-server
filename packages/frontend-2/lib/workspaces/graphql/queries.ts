import { graphql } from '~~/lib/common/generated/gql'

export const workspaceProjectsQuery = graphql(`
  query WorkspaceProjectsQuery(
    $workspaceId: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
  ) {
    workspace(id: $workspaceId) {
      projects(filter: $filter, cursor: $cursor) {
        totalCount
        items {
          ...ProjectDashboardItem
        }
        cursor
      }
    }
  }
`)
