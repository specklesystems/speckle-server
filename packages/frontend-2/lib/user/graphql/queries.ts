import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment UserEmails_User on User {
    id
    emails {
      id
      email
      primary
      verified
    }
  }
`)

export const userEmailsQuery = graphql(`
  query UserEmailsQuery {
    activeUser {
      ...UserEmails_User
    }
  }
`)
