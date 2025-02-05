import { graphql } from '~~/lib/common/generated/gql'

export const dashboardProjectsPageQuery = graphql(`
  query DashboardProjectsPageQuery {
    activeUser {
      id
      projects(limit: 3) {
        items {
          ...DashboardProjectCard_Project
        }
      }
      ...ProjectsDashboardHeaderProjects_User
    }
  }
`)

export const dashboardProjectsPageWorkspacesQuery = graphql(`
  query DashboardProjectsPageWorkspaceQuery {
    activeUser {
      id
      ...ProjectsDashboardHeaderWorkspaces_User
    }
  }
`)
