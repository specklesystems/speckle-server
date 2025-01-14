import { graphql } from '~~/lib/common/generated/gql'

export const settingsSidebarQuery = graphql(`
  query SettingsSidebar {
    activeUser {
      ...SettingsDialog_User
    }
  }
`)

export const settingsSidebarAutomateFunctionsQuery = graphql(`
  query SettingsSidebarAutomateFunctions {
    activeUser {
      ...Sidebar_User
    }
  }
`)

export const settingsWorkspaceGeneralQuery = graphql(`
  query SettingsWorkspaceGeneral($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesGeneral_Workspace
    }
  }
`)

export const settingsWorkspaceBillingQuery = graphql(`
  query SettingsWorkspaceBilling($slug: String!) {
    workspaceBySlug(slug: $slug) {
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
  query SettingsWorkspaceRegions($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      ...SettingsWorkspacesRegions_Workspace
    }
    serverInfo {
      ...SettingsWorkspacesRegions_ServerInfo
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
      slug
      readOnly
      projects(limit: $limit, cursor: $cursor, filter: $filter) {
        cursor
        ...SettingsWorkspacesProjects_ProjectCollection
      }
    }
  }
`)

export const settingsWorkspacesSecurityQuery = graphql(`
  query SettingsWorkspaceSecurity($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesSecurity_Workspace
    }
    activeUser {
      ...SettingsWorkspacesSecurity_User
    }
  }
`)
