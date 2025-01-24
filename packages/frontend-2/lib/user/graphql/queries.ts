import { graphql } from '~/lib/common/generated/gql'

export const emailFieldsFragment = graphql(`
  fragment EmailFields on UserEmail {
    id
    email
    verified
    primary
  }
`)

export const userEmailsQuery = graphql(`
  query UserEmails {
    activeUser {
      id
      emails {
        ...EmailFields
      }
    }
  }
`)

export const deleteUserEmailMutation = graphql(`
  mutation DeleteUserEmail($input: DeleteUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        delete(input: $input) {
          id
          emails {
            ...EmailFields
          }
        }
      }
    }
  }
`)
