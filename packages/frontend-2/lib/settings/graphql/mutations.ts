import { graphql } from '~~/lib/common/generated/gql'

export const settingsCreateUserEmailMutation = graphql(`
  mutation SettingsCreateUserEmail($input: CreateUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        create(input: $input) {
          id
          emails {
            ...SettingsUserEmailCards_UserEmail
          }
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
          id
          emails {
            ...SettingsUserEmailCards_UserEmail
          }
        }
      }
    }
  }

  mutation Delete($input: DeleteUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        delete(input: $input) {
          id
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
          id
          emails {
            ...SettingsUserEmailCards_UserEmail
          }
        }
      }
    }
  }
`)
