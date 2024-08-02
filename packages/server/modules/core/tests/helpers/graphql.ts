import { gql } from 'apollo-server-express'

export const userWithEmailsFragment = gql`
  fragment UserWithEmails on User {
    id
    name
    createdAt
    role
    emails {
      id
      email
      verified
      primary
    }
  }
`

export const getActiveUserEmails = gql`
  query GetActiveUserEmails {
    activeUser {
      ...UserWithEmails
    }
  }

  ${userWithEmailsFragment}
`

export const createUserEmailQuery = gql`
  mutation CreateUserEmail($input: CreateUserEmailInput!) {
    createUserEmail(input: $input)
  }
`

export const deleteUserEmailQuery = gql`
  mutation DeleteUserEmail($input: DeleteUserEmailInput!) {
    deleteUserEmail(input: $input)
  }
`

export const setPrimaryUserEmailQuery = gql`
  mutation SetPrimaryUserEmail($input: SetPrimaryUserEmailInput!) {
    setPrimaryUserEmail(input: $input)
  }
`
