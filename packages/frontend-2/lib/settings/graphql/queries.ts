import { graphql } from '~~/lib/common/generated/gql'

export const settingsSidebarQuery = graphql(`
  query SettingsSidebar {
    activeUser {
      ...SettingsSidebar_User
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

// TODO: Remove old one post-migration
export const settingsWorkspaceBillingQueryNew = graphql(`
  query SettingsWorkspaceBillingNew($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      ...WorkspaceBillingPageNew_Workspace
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
  query SettingsWorkspacesMembers($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembers_Workspace
    }
  }
`)

export const settingsWorkspacesMembersTableQuery = graphql(`
  query SettingsWorkspacesMembersTable($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembersTable_Workspace
      ...SettingsWorkspacesNewMembersTable_Workspace
    }
  }
`)

export const settingsWorkspacesMembersGuestsQuery = graphql(`
  query SettingsWorkspacesMembersGuests($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembersGuestsTable_Workspace
      ...SettingsWorkspacesMembersNewGuestsTable_Workspace
    }
  }
`)

export const settingsWorkspacesMembersInvitesQuery = graphql(`
  query SettingsWorkspacesMembersInvites($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembersInvitesTable_Workspace
    }
  }
`)

export const settingsWorkspacesMembersRequestsQuery = graphql(`
  query SettingsWorkspacesMembersRequests($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembersRequestsTable_Workspace
    }
  }
`)

export const settingsWorkspacesMembersSearchQuery = graphql(`
  query SettingsWorkspacesMembersSearch($slug: String!, $filter: WorkspaceTeamFilter) {
    workspaceBySlug(slug: $slug) {
      id
      team(filter: $filter, limit: 250) {
        items {
          id
          ...SettingsWorkspacesMembersTable_WorkspaceCollaborator
          ...SettingsWorkspacesNewMembersTable_WorkspaceCollaborator
        }
      }
    }
  }
`)

export const settingsWorkspacesInvitesSearchQuery = graphql(`
  query SettingsWorkspacesInvitesSearch(
    $slug: String!
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
  ) {
    workspaceBySlug(slug: $slug) {
      ...SettingsWorkspacesMembersInvitesTable_Workspace
    }
  }
`)

export const settingsWorkspacesProjectsQuery = graphql(`
  query SettingsWorkspacesProjects(
    $slug: String!
    $limit: Int!
    $cursor: String
    $filter: WorkspaceProjectsFilter
  ) {
    workspaceBySlug(slug: $slug) {
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
