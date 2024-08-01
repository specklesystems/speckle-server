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

export const settingsUserEmailsQuery = graphql(`
  query SettingsUserEmails {
    userEmails {
      email
      id
      primary
      verified
    }
  }
`)
