import { graphql } from '~~/lib/common/generated/gql'

export const settingsSidebarQuery = graphql(`
  query SettingsSidebar {
    activeUser {
      activeWorkspace {
        ...SettingsSidebar_Workspace
      }
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
      ...WorkspaceBillingPage_Workspace
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
      ...SettingsWorkspacesMembersCounts_Workspace
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
      role
      ...SettingsWorkspacesMembersTableHeader_Workspace
      team(filter: $filter, limit: 250) {
        items {
          id
          ...SettingsWorkspacesMembersTable_WorkspaceCollaborator
        }
        cursor
        totalCount
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
      ...SettingsWorkspacesProjects_Workspace
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
  }
`)
