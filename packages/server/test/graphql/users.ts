import { ApolloServer, gql } from 'apollo-server-express'
import {
  GetActiveUserQuery,
  GetActiveUserQueryVariables,
  GetAdminUsersQuery,
  GetAdminUsersQueryVariables,
  GetOtherUserQuery,
  GetOtherUserQueryVariables,
  GetPendingEmailVerificationStatusQuery,
  GetPendingEmailVerificationStatusQueryVariables,
  RequestVerificationMutation,
  RequestVerificationMutationVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'

const baseUserFieldsFragment = gql`
  fragment BaseUserFields on User {
    id
    email
    name
    bio
    company
    avatar
    verified
    role
  }
`

const baseLimitedUserFieldsFragment = gql`
  fragment BaseLimitedUserFields on LimitedUser {
    id
    name
    bio
    company
    avatar
    verified
  }
`

const getActiveUserQuery = gql`
  query GetActiveUser {
    activeUser {
      ...BaseUserFields
    }
  }

  ${baseUserFieldsFragment}
`

const getOtherUserQuery = gql`
  query GetOtherUser($id: String!) {
    otherUser(id: $id) {
      ...BaseLimitedUserFields
    }
  }

  ${baseLimitedUserFieldsFragment}
`

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
 * @deprecated Leaving this behind while we still have the old user() query. This should
 * be deleted afterwards
 */
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

export const getActiveUser = (apollo: ApolloServer) =>
  executeOperation<GetActiveUserQuery, GetActiveUserQueryVariables>(
    apollo,
    getActiveUserQuery
  )

export const getOtherUser = (
  apollo: ApolloServer,
  variables: GetOtherUserQueryVariables
) =>
  executeOperation<GetOtherUserQuery, GetOtherUserQueryVariables>(
    apollo,
    getOtherUserQuery,
    variables
  )

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
