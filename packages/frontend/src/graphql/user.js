import { limitedUserFieldsFragment } from '@/graphql/fragments/user'
import { commonStreamFieldsFragment } from '@/graphql/streams'
import { gql } from '@apollo/client/core'

export const commonUserFieldsFragment = gql`
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
export const userFavoriteStreamsQuery = gql`
  query UserFavoriteStreams($cursor: String) {
    user {
      ...CommonUserFields
      favoriteStreams(cursor: $cursor, limit: 10) {
        totalCount
        cursor
        items {
          ...CommonStreamFields
        }
      }
    }
  }

  ${commonUserFieldsFragment}
  ${commonStreamFieldsFragment}
`

/**
 * Get main user metadata
 */
export const mainUserDataQuery = gql`
  query MainUserData {
    user {
      ...CommonUserFields
    }
  }

  ${commonUserFieldsFragment}
`

/**
 * Main metadata + extra info shown on profile page
 */
export const profileSelfQuery = gql`
  query ExtraUserData {
    user {
      ...CommonUserFields
      totalOwnedStreamsFavorites
    }
  }

  ${commonUserFieldsFragment}
`

/**
 * (Limited, not admin) User search
 */
export const userSearchQuery = gql`
  query UserSearch($query: String!, $limit: Int!, $cursor: String, $archived: Boolean) {
    userSearch(query: $query, limit: $limit, cursor: $cursor, archived: $archived) {
      cursor
      items {
        ...LimitedUserFields
      }
    }
  }

  ${limitedUserFieldsFragment}
`

/**
 * Basic query for checking if user is logged in
 */
export const isLoggedInQuery = gql`
  query IsLoggedIn {
    user {
      id
    }
  }
`

/**
 * Admin panel (invited/registered) users list
 */
export const adminUsersListQuery = gql`
  query AdminUsersList($limit: Int, $offset: Int, $query: String) {
    adminUsers(limit: $limit, offset: $offset, query: $query) {
      totalCount
      items {
        id
        registeredUser {
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
          authorizedApps {
            name
          }
        }
        invitedUser {
          id
          email
          invitedBy {
            id
            name
          }
        }
      }
    }
  }
`

export const userTimelineQuery = gql`
  query UserTimeline($cursor: DateTime) {
    user {
      id
      timeline(cursor: $cursor) {
        totalCount
        cursor
        items {
          actionType
          userId
          streamId
          resourceId
          resourceType
          time
          info
          message
        }
      }
    }
  }
`
