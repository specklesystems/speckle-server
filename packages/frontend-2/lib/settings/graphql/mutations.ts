import { graphql } from '~~/lib/common/generated/gql'

export const settingsCreateUserEmailMutation = graphql(`
  mutation SettingsCreateUserEmail($input: CreateUserEmailInput!) {
    createUserEmail(input: $input)
  }
`)

export const settingsDeleteUserEmailMutation = graphql(`
  mutation SettingsDeleteUserEmail($input: DeleteUserEmailInput!) {
    deleteUserEmail(input: $input)
  }
`)

export const settingsSetPrimaryUserEmailMutation = graphql(`
  mutation SettingsPrimaryUserEmail($input: SetPrimaryUserEmailInput!) {
    setPrimaryUserEmail(input: $input)
  }
`)
