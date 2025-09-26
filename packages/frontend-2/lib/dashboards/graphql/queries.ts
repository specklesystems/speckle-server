import { graphql } from '~~/lib/common/generated/gql'

export const dashboardAccessCheckQuery = graphql(`
  query DashboardAccessCheck($id: String!) {
    dashboard(id: $id) {
      id
    }
  }
`)

export const dashboardQuery = graphql(`
  query Dashboard($id: String!) {
    dashboard(id: $id) {
      id
      ...WorkspaceDashboards_Dashboard
    }
  }
`)

export const workspaceDashboardsQuery = graphql(`
  query WorkspaceDashboards($workspaceSlug: String!, $cursor: String) {
    workspaceBySlug(slug: $workspaceSlug) {
      id
      dashboards(cursor: $cursor) {
        cursor
        items {
          id
          ...DashboardsCard_Dashboard
        }
      }
    }
  }
`)
