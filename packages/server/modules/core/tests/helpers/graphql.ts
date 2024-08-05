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
    activeUserMutations {
      emailMutations {
        create(input: $input) {
          id
        }
      }
    }
  }
`

export const deleteUserEmailQuery = gql`
  mutation DeleteUserEmail($input: DeleteUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        delete(input: $input) {
          id
        }
      }
    }
  }
`

export const setPrimaryUserEmailQuery = gql`
  mutation SetPrimaryUserEmail($input: SetPrimaryUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        setPrimary(input: $input) {
          id
        }
      }
    }
  }
`
