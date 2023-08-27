import { graphql } from '~~/lib/common/generated/gql'

export const serverManagementDataQuery = graphql(`
  query Admin {
    admin {
      serverStatistics {
        totalProjectCount
        totalUserCount
      }
      inviteList {
        totalCount
      }
    }
    serverInfo {
      name
      version
    }
  }
`)

export const serverInfoQuery = graphql(`
  query ServerSettingsDialogData {
    serverInfo {
      name
      description
      adminContact
      company
      termsOfService
      inviteOnly
    }
  }
`)

export const getUsers = graphql(`
  query AdminPanelUsersList($limit: Int!, $cursor: String, $query: String) {
    admin {
      userList(limit: $limit, cursor: $cursor, query: $query) {
        totalCount
        cursor
        items {
          id
          email
          avatar
          name
          role
          verified
          company
        }
      }
    }
  }
`)

export const getProjects = graphql(`
  query AdminPanelProjectsList(
    $query: String
    $orderBy: String
    $limit: Int!
    $visibility: String
    $cursor: String
  ) {
    admin {
      projectList(
        query: $query
        orderBy: $orderBy
        limit: $limit
        visibility: $visibility
        cursor: $cursor
      ) {
        cursor
        items {
          id
          name
          visibility
          createdAt
          updatedAt
          models {
            totalCount
          }
          versions {
            totalCount
          }
          team {
            user {
              name
              id
              avatar
            }
          }
        }
        totalCount
        cursor
      }
    }
  }
`)

export const getInvites = graphql(`
  query AdminPanelInvitesList($limit: Int!, $cursor: String, $query: String) {
    admin {
      inviteList(limit: $limit, cursor: $cursor, query: $query) {
        cursor
        items {
          email
          id
          invitedBy {
            id
            name
          }
        }
        totalCount
      }
    }
  }
`)
