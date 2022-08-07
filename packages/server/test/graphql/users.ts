import { ApolloServer, gql } from 'apollo-server-express'
import {
  GetAdminUsersQuery,
  GetAdminUsersQueryVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'

const adminUsersQuery = gql`
  query GetAdminUsers($limit: Int! = 25, $offset: Int! = 0, $query: String = null) {
    adminUsers(limit: $limit, offset: $offset, query: $query) {
      totalCount
      items {
        id
        registeredUser {
          id
          email
          name
        }
        invitedUser {
          id
          email
          invitedBy {
            id
            name
          }
        }
      }
    }
  }
`

/**
 * adminUsers query
 */
export async function getAdminUsersList(
  apollo: ApolloServer,
  variables: GetAdminUsersQueryVariables
) {
  return await executeOperation<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
    apollo,
    adminUsersQuery,
    variables
  )
}
