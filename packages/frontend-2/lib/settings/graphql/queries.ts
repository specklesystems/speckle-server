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
  query SettingsWorkspacesMembers($workspaceId: String!) {
    workspace(id: $workspaceId) {
      team {
        role
        id
        user {
          avatar
          name
          company
          verified
        }
      }
    }
  }
`)
