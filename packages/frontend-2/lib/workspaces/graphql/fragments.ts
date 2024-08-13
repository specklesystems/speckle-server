import { graphql } from '~~/lib/common/generated/gql'

export const workspaceProjectsFragment = graphql(`
  fragment WorkspaceProjects_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...ProjectDashboardItem
    }
    cursor
  }
`)
