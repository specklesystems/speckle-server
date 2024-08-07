import { graphql } from '~~/lib/common/generated/gql'

export const workspacePageQuery = graphql(`
  query WorkspacePageQuery(
    $workspaceId: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
  ) {
    workspace(id: $workspaceId) {
      name
      logo
      id
      description
      team {
        id
        user {
          id
          name
          avatar
        }
      }
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
