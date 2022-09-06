import { ApolloServer, gql } from 'apollo-server-express'
import {
  GetAdminUsersQuery,
  GetAdminUsersQueryVariables,
  GetPendingEmailVerificationStatusQuery,
  GetPendingEmailVerificationStatusQueryVariables,
  RequestVerificationMutation,
  RequestVerificationMutationVariables
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

const getPendingEmailVerificationStatusQuery = gql`
  query GetPendingEmailVerificationStatus($id: String) {
    user(id: $id) {
      hasPendingVerification
    }
  }
`

const requestVerificationMutation = gql`
  mutation RequestVerification {
    requestVerification
  }
`

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

export const getPendingEmailVerificationStatus = (
  apollo: ApolloServer,
  variables: GetPendingEmailVerificationStatusQueryVariables
) =>
  executeOperation<
    GetPendingEmailVerificationStatusQuery,
    GetPendingEmailVerificationStatusQueryVariables
  >(apollo, getPendingEmailVerificationStatusQuery, variables)

export const requestVerification = (
  apollo: ApolloServer,
  variables?: RequestVerificationMutationVariables
) =>
  executeOperation<RequestVerificationMutation, RequestVerificationMutationVariables>(
    apollo,
    requestVerificationMutation,
    variables
  )
