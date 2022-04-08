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
    commentCount
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

/**
 * Retrieve a single stream
 */
export const StreamQuery = gql`
  query Stream($id: String!) {
    stream(id: $id) {
      ...CommonStreamFields
    }
  }

  ${COMMON_STREAM_FIELDS}
`
