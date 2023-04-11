import { graphql } from '~~/lib/common/generated/gql'

export const updateUserMutation = graphql(`
  mutation UpdateUser($input: UserUpdateInput!) {
    activeUserMutations {
      update(user: $input) {
        id
        name
        bio
        company
        avatar
      }
    }
  }
`)

export const updateNotificationPreferencesMutation = graphql(`
  mutation UpdateNotificationPreferences($input: JSONObject!) {
    userNotificationPreferencesUpdate(preferences: $input)
  }
`)

export const deleteAccountMutation = graphql(`
  mutation DeleteAccount($input: UserDeleteInput!) {
    userDelete(userConfirmation: $input)
  }
`)

export const changePasswordMutation = graphql(`
  mutation ChangePassword($input: ChangePasswordInput!) {
    activeUserMutations {
      changePassword(input: $input)
    }
  }
`)
