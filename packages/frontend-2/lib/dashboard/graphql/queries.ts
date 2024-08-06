import { graphql } from '~~/lib/common/generated/gql'

export const dashboardProjectsQuery = graphql(`
  query DashboardProjectsQuery {
    activeUser {
      projects(limit: 3) {
        items {
          ...DashboardProjectCard_Project
        }
      }
    }
  }
`)
