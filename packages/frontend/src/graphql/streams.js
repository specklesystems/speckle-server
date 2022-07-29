import {
  limitedUserFieldsFragment,
  streamCollaboratorFieldsFragment
} from '@/graphql/fragments/user'
import { gql } from '@apollo/client/core'

/**
 * Common stream fields when querying for streams
 */
export const commonStreamFieldsFragment = gql`
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
export const streamQuery = gql`
  query Stream($id: String!) {
    stream(id: $id) {
      ...CommonStreamFields
    }
  }

  ${commonStreamFieldsFragment}
`

/**
 * Retrieve stream collaborators info
 */
export const streamWithCollaboratorsQuery = gql`
  query StreamWithCollaborators($id: String!) {
    stream(id: $id) {
      id
      name
      isPublic
      role
      collaborators {
        ...StreamCollaboratorFields
      }
      pendingCollaborators {
        title
        inviteId
        role
        user {
          ...LimitedUserFields
        }
      }
    }
  }
  ${limitedUserFieldsFragment}
  ${streamCollaboratorFieldsFragment}
`

export const streamWithActivityQuery = gql`
  query StreamWithActivity($id: String!, $cursor: DateTime) {
    stream(id: $id) {
      id
      name
      createdAt
      commits {
        totalCount
      }
      branches {
        totalCount
      }
      activity(cursor: $cursor) {
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

/**
 * Remove authenticated user from the collaborators list
 */
export const leaveStreamMutation = gql`
  mutation LeaveStream($streamId: String!) {
    streamLeave(streamId: $streamId)
  }
`

/**
 * Update a user's stream permission
 */
export const updateStreamPermissionMutation = gql`
  mutation UpdateStreamPermission($params: StreamUpdatePermissionInput!) {
    streamUpdatePermission(permissionParams: $params)
  }
`
