import { graphql } from '~~/lib/common/generated/gql'

export const profileEditDialogQuery = graphql(`
  query ProfileEditDialog {
    activeUser {
      ...SettingsUserProfileDetails_User
      ...SettingsUserNotifications_User
      ...SettingsUserProfileDeleteAccount_User
    }
  }
`)
