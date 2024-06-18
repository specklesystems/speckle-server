import { gql } from 'apollo-server-express'

export const basicProjectFieldsFragment = gql`
  fragment BasicProjectFields on Project {
    id
    name
    description
    visibility
    allowPublicComments
    role
    createdAt
    updatedAt
  }
`

/**
 * query: String
    orderBy: String
    visibility: String
    limit: Int! = 25
    cursor: String = null
 */

export const adminProjectList = gql`
  query AdminProjectList(
    $query: String
    $orderBy: String
    $visibility: String
    $limit: Int! = 25
    $cursor: String = null
  ) {
    admin {
      projectList(
        query: $query
        orderBy: $orderBy
        visibility: $visibility
        limit: $limit
        cursor: $cursor
      ) {
        cursor
        totalCount
        items {
          ...BasicProjectFields
        }
      }
    }
  }

  ${basicProjectFieldsFragment}
`
