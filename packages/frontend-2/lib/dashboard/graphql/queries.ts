import { graphql } from '~~/lib/common/generated/gql'

export const dashboardProjectsQuery = graphql(`
  query DashboardProjectsQuery {
    activeUser {
      projects(limit: 3) {
        items {
          id
          name
          role
          updatedAt
          models {
            totalCount
          }
          team {
            user {
              avatar
              id
              name
            }
          }
        }
      }
    }
  }
`)
