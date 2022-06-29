const { gql } = require('apollo-server-express')

const adminUsersQuery = gql`
  query ($limit: Int! = 25, $offset: Int! = 0, $query: String = null) {
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

module.exports = {
  /**
   * adminUsers query
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  getAdminUsersList(apollo, { limit, offset, query }) {
    return apollo.executeOperation({
      query: adminUsersQuery,
      variables: { limit, offset, query }
    })
  }
}
