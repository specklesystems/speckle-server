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

export const projectPageQuery = graphql(`
  query ProjectPageQuery($id: String!) {
    project(id: $id) {
      ...ProjectPageProject
    }
  }
`)
