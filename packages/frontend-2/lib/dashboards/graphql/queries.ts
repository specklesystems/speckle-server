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
  query WorkspaceDashboards(
    $workspaceSlug: String!
    $cursor: String
    $filter: WorkspaceDashboardsFilter
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      id
      dashboards(cursor: $cursor, filter: $filter) {
        cursor
        items {
          id
          ...DashboardsCard_Dashboard
        }
      }
    }
  }
`)

export const projectDashboardsQuery = graphql(`
  query ProjectDashboards(
    $projectId: String!
    $cursor: String
    $filter: ProjectDashboardsFilter
  ) {
    project(id: $projectId) {
      id
      workspace {
        slug
      }
      dashboards(cursor: $cursor, filter: $filter) {
        cursor
        items {
          id
          ...DashboardsCard_Dashboard
        }
      }
    }
  }
`)
