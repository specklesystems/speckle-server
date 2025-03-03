import { graphql } from '~/lib/common/generated/gql'

export const emailFieldsFragment = graphql(`
  fragment EmailFields on UserEmail {
    id
    email
    verified
    primary
    userId
  }
`)

export const userEmailsQuery = graphql(`
  query UserEmails {
    activeUser {
      id
      emails {
        ...EmailFields
      }
      hasPendingVerification
    }
  }
`)
