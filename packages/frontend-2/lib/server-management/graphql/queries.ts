import { graphql } from '~~/lib/common/generated/gql'

export const serverManagementDataQuery = graphql(`
  query ServerManagementDataPage {
    admin {
      userList {
        totalCount
      }
      projectList {
        totalCount
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
      guestModeEnabled
    }
  }
`)

export const getUsersQuery = graphql(`
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

export const getProjectsQuery = graphql(`
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
        ...SettingsServerProjects_ProjectCollection
      }
    }
  }
`)

export const getInvitesQuery = graphql(`
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

export const getUsersCountQuery = graphql(`
  query UsersCount {
    admin {
      userList {
        totalCount
      }
    }
  }
`)

export const getInvitesCountQuery = graphql(`
  query InvitesCount {
    admin {
      inviteList {
        totalCount
      }
    }
  }
`)
