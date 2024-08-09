import { graphql } from '~~/lib/common/generated/gql'

export const settingsCreateUserEmailMutation = graphql(`
  mutation SettingsCreateUserEmail($input: CreateUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        create(input: $input) {
          ...SettingsUserEmail_User
        }
      }
    }
  }
`)

export const settingsDeleteUserEmailMutation = graphql(`
  mutation SettingsDeleteUserEmail($input: DeleteUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        delete(input: $input) {
          ...SettingsUserEmail_User
        }
      }
    }
  }
`)

export const settingsSetPrimaryUserEmailMutation = graphql(`
  mutation SettingsSetPrimaryUserEmail($input: SetPrimaryUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        setPrimary(input: $input) {
          ...SettingsUserEmail_User
        }
      }
    }
  }
`)

export const settingsNewEmailVerificationMutation = graphql(`
  mutation SettingsNewEmailVerification($input: EmailVerificationRequestInput!) {
    activeUserMutations {
      emailMutations {
        requestNewEmailVerification(input: $input)
      }
    }
  }
`)
