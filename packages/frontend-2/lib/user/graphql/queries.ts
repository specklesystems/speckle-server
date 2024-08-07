import { graphql } from '~~/lib/common/generated/gql'

export const profileEditDialogQuery = graphql(`
  query ProfileEditDialog {
    activeUser {
      ...UserProfileEditDialogBio_User
      ...UserProfileEditDialogNotificationPreferences_User
      ...UserProfileEditDialogDeleteAccount_User
    }
  }
`)

export const activeUserEmailsQuery = graphql(`
  query ActiveUserEmails {
    activeUser {
      emails {
        email
        verified
      }
    }
  }
`)
