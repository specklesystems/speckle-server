import gql from 'graphql-tag'

export const getUserNotifications = gql`
  query GetUserNotifications($limit: Int, $cursor: String) {
    activeUser {
      notifications(limit: $limit, cursor: $cursor) {
        items {
          id
          type
          createdAt
          payload
          read
          updatedAt
        }
        cursor
        totalCount
      }
    }
  }
`

export const deleteUserNotifications = gql`
  mutation UserBulkDeleteNotidication($ids: [String!]!) {
    notificationMutations {
      bulkDelete(ids: $ids)
    }
  }
`

export const updateUserNotifications = gql`
  mutation UserBulkUpdateNotifications($input: [NotificationUpdateInput!]!) {
    notificationMutations {
      bulkUpdate(input: $input)
    }
  }
`
