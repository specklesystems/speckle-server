import { COMMON_STREAM_FIELDS } from '@/graphql/streams'
import gql from 'graphql-tag'

export const COMMON_USER_FIELDS = gql`
  fragment CommonUserFields on User {
    id
    suuid
    email
    name
    bio
    company
    avatar
    verified
    profiles
    role
    suuid
    streams {
      totalCount
    }
    commits(limit: 1) {
      totalCount
      items {
        id
        createdAt
      }
    }
  }
`

/**
 * User data with favorite streams
 */
export const UserFavoriteStreamsQuery = gql`
  ${COMMON_USER_FIELDS}
  ${COMMON_STREAM_FIELDS}

  query UserFavoriteStreams($cursor: String) {
    user {
      ...CommonUserFields
      favoriteStreams(cursor: $cursor, limit: 3) {
        totalCount
        cursor
        items {
          ...CommonStreamFields
        }
      }
    }
  }
`
