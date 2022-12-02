import { graphql } from '~~/lib/common/generated/gql'

export const projectsDashboardQuery = graphql(`
  query ProjectsDashboardQuery {
    activeUser {
      projects {
        totalCount
        ...ProjectsDashboardFilled
      }
    }
  }
`)
