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
      id
      name
      description
      logo
    }
  }
`)
