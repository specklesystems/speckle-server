import { graphql } from '~~/lib/common/generated/gql'

export const isLoggedInQuery = graphql(`
  query IsLoggedIn {
    activeUser {
      id
    }
  }
`)
