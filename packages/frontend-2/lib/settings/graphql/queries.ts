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

export const settingsWorkspacesProjectsQuery = graphql(`
  query SettingsWorkspacesProjects(
    $workspaceId: String!
    $limit: Int!
    $cursor: String
    $filter: WorkspaceProjectsFilter
  ) {
    workspace(id: $workspaceId) {
      id
      projects(limit: $limit, cursor: $cursor, filter: $filter) {
        cursor
        ...SettingsWorkspacesProjects_ProjectCollection
      }
    }
  }
`)
