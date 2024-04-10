import { graphql } from '~/lib/common/generated/gql'

export const searchAutomateFunctionReleasesQuery = graphql(`
  query SearchAutomateFunctionReleases(
    $functionId: ID!
    $cursor: String
    $limit: Int
    $filter: AutomateFunctionReleasesFilter
  ) {
    automateFunction(id: $functionId) {
      id
      releases(cursor: $cursor, limit: $limit, filter: $filter) {
        cursor
        totalCount
        items {
          ...SearchAutomateFunctionReleaseItem
        }
      }
    }
  }
`)

export const functionAccessCheckQuery = graphql(`
  query FunctionAccessCheck($id: ID!) {
    automateFunction(id: $id) {
      id
    }
  }
`)
