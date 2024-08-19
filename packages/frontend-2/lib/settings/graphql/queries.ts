import { graphql } from '~~/lib/common/generated/gql'

export const settingsSidebarQuery = graphql(`
  query SettingsSidebar {
    activeUser {
      ...SettingsDialog_User
    }
  }
`)

export const settingsWorkspaceGeneralQuery = graphql(`
  query SettingsWorkspaceGeneral($id: String!) {
    workspace(id: $id) {
      ...SettingsWorkspacesGeneral_Workspace
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
      ...SettingsWorkspacesMembersGuestsTable_Workspace
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

export const settingsWorkspaceSecurityQuery = graphql(`
  query SettingsWorkspaceSecutiry($workspaceId: String!) {
    workspace(id: $workspaceId) {
      domains {
        id
        domain
      }
      domainBasedMembershipProtectionEnabled
      discoverabilityEnabled
    }
  }
`)
