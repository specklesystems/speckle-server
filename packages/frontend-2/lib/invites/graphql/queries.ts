import { graphql } from '~~/lib/common/generated/gql'

export const inviteUserSearchQuery = graphql(`
  query InviteUserSearch($input: UsersRetrievalInput!) {
    users(input: $input) {
      items {
        id
        name
        avatar
      }
    }
  }
`)
