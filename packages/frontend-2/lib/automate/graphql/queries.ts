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

export const projectAutomationCreationPublicKeysQuery = graphql(`
  query ProjectAutomationCreationPublicKeys(
    $projectId: String!
    $automationId: String!
  ) {
    project(id: $projectId) {
      id
      automation(id: $automationId) {
        id
        creationPublicKeys
      }
    }
  }
`)

export const automateFunctionsPagePaginationQuery = graphql(`
  query AutomateFunctionsPagePagination($search: String, $cursor: String) {
    ...AutomateFunctionsPageItems_Query
  }
`)
