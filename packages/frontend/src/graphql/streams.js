import gql from 'graphql-tag'

/**
 * Common stream fields when querying for streams
 */
export const COMMON_STREAM_FIELDS = gql`
  fragment CommonStreamFields on Stream {
    id
    name
    description
    role
    isPublic
    createdAt
    updatedAt
    collaborators {
      id
      name
      company
      avatar
      role
    }
    commits(limit: 1) {
      totalCount
    }
    branches {
      totalCount
    }
    favoritedDate
    favoritesCount
  }
`
