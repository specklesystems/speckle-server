import { graphql } from '~~/lib/common/generated/gql'

export const projectsDashboardQuery = graphql(`
  query ProjectsDashboardQuery {
    activeUser {
      id
      projects {
        totalCount
        ...ProjectsDashboardFilled
      }
    }
  }
`)
