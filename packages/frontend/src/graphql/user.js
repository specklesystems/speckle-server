import { activityMainFieldsFragment } from '@/graphql/fragments/activity'
import { limitedUserFieldsFragment } from '@/graphql/fragments/user'
import { commonStreamFieldsFragment } from '@/graphql/streams'
import { gql } from '@apollo/client/core'

export const commonUserFieldsFragment = gql`
  fragment CommonUserFields on User {
    id
    email
    name
    bio
    company
    avatar
    verified
    hasPendingVerification
    profiles
    role
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
    activeUser {
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
    activeUser {
      ...CommonUserFields
    }
  }

  ${commonUserFieldsFragment}
`

/**
 * Main metadata + extra info shown on profile page
 */
export const profileSelfQuery = gql`
  query ProfileSelf {
    activeUser {
      ...CommonUserFields
      totalOwnedStreamsFavorites
      notificationPreferences
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
    activeUser {
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
    activeUser {
      id
      timeline(cursor: $cursor) {
        totalCount
        cursor
        items {
          ...ActivityMainFields
        }
      }
    }
  }

  ${activityMainFieldsFragment}
`

export const validatePasswordStrengthQuery = gql`
  query ValidatePasswordStrength($pwd: String!) {
    userPwdStrength(pwd: $pwd) {
      score
      feedback {
        warning
        suggestions
      }
    }
  }
`

export const emailVerificationBannerStateQuery = gql`
  query EmailVerificationBannerState {
    activeUser {
      id
      email
      verified
      hasPendingVerification
    }
  }
`

export const requestVerificationMutation = gql`
  mutation RequestVerification {
    requestVerification
  }
`

export const updateUserNotificationPreferencesMutation = gql`
  mutation UpdateUserNotificationPreferences($preferences: JSONObject!) {
    userNotificationPreferencesUpdate(preferences: $preferences)
  }
`
