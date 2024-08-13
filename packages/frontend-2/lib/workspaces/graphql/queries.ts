import { graphql } from '~~/lib/common/generated/gql'

export const workspacePageQuery = graphql(`
  query WorkspacePageQuery(
    $workspaceId: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
  ) {
    workspace(id: $workspaceId) {
      id
      ...WorkspaceHeader_Workspace
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
