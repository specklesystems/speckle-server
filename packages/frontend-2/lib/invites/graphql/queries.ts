import { graphql } from '~~/lib/common/generated/gql'

export const getUsersByEmailQuery = graphql(`
  query GetUsersByEmail($input: BulkUsersRetrievalInput!, $workspaceId: String) {
    usersByEmail(input: $input) {
      id
      role
      workspaceRole(workspaceId: $workspaceId)
    }
  }
`)
