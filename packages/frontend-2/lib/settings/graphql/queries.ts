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

export const settingsWorkspaceGeneralQuery = graphql(`
  query SettingsWorkspaceGeneral($id: String!) {
    workspace(id: $id) {
      ...SettingsWorkspacesGeneral_Workspace
    }
  }
`)

export const settingsWorkspacesMembersQuery = graphql(`
  query SettingsWorkspacesMembers($workspaceId: String!) {
    workspace(id: $workspaceId) {
      team {
        role
        id
        user {
          id
          avatar
          name
          company
          verified
        }
      }
    }
  }
`)
