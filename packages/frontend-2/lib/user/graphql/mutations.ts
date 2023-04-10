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
