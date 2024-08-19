import { graphql } from '~~/lib/common/generated/gql'

export const profileEditDialogQuery = graphql(`
  query ProfileEditDialog {
    activeUser {
      ...SettingsUserProfileDetails_User
      ...UserProfileEditDialogNotificationPreferences_User
      ...SettingsUserProfileDeleteAccount_User
    }
  }
`)
