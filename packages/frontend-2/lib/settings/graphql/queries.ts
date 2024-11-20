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

export const settingsWorkspaceBillingQuery = graphql(`
  query SettingsWorkspaceBilling($workspaceId: String!) {
    workspace(id: $workspaceId) {
      id
      ...SettingsWorkspacesBilling_Workspace
    }
  }
`)

export const settingsWorkspaceBillingCustomerPortalQuery = graphql(`
  query SettingsWorkspaceBillingCustomerPortal($workspaceId: String!) {
    workspace(id: $workspaceId) {
      customerPortalUrl
    }
  }
`)

export const settingsWorkspaceRegionsQuery = graphql(`
  query SettingsWorkspaceRegions($workspaceId: String!) {
    workspace(id: $workspaceId) {
      id
      ...SettingsWorkspacesRegions_Workspace
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

export const settingsWorkspacesMembersSearchQuery = graphql(`
  query SettingsWorkspacesMembersSearch(
    $workspaceId: String!
    $filter: WorkspaceTeamFilter
  ) {
    workspace(id: $workspaceId) {
      id
      team(filter: $filter) {
        items {
          id
          ...SettingsWorkspacesMembersMembersTable_WorkspaceCollaborator
        }
      }
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

export const settingsWorkspacesSecurityQuery = graphql(`
  query SettingsWorkspaceSecurity($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...SettingsWorkspacesSecurity_Workspace
    }
    activeUser {
      ...SettingsWorkspacesSecurity_User
    }
  }
`)
