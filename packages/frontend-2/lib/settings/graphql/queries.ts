import { graphql } from '~~/lib/common/generated/gql'

export const settingsSidebarWorkspacesQuery = graphql(`
  query SettingsSidebarWorkspaces {
    activeUser {
      workspaces {
        items {
          id
          name
        }
      }
    }
  }
`)

export const settingsWorkspacesMembersQuery = graphql(`
  query SettingsWorkspacesMembers(
    $workspaceId: String!
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
  ) {
    workspace(id: $workspaceId) {
      ...SettingsWorkspacesMembers_Workspace
      ...SettingsWorkspacesMembersMembersTable_Workspace
      ...SettingsWorkspacesMembersInvitesTable_Workspace
    }
  }
`)

export const settingsWorkspacesInvitesSearchQuery = graphql(`
  query SettingsWorkspacesInvitesSearch(
    $workspaceId: String!
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
  ) {
    workspace(id: $workspaceId) {
      ...SettingsWorkspacesMembersInvitesTable_Workspace
    }
  }
`)

export const settingsUserEmailsQuery = graphql(`
  query SettingsUserEmailsQuery {
    activeUser {
      ...SettingsUserEmails_User
    }
  }
`)
