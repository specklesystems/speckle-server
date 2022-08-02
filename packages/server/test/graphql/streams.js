const { gql } = require('apollo-server-express')

const leaveStreamMutation = gql`
  mutation LeaveStream($streamId: String!) {
    streamLeave(streamId: $streamId)
  }
`

module.exports = {
  /**
   * streamLeave mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  leaveStream(apollo, { streamId }) {
    return apollo.executeOperation({
      query: leaveStreamMutation,
      variables: {
        streamId
      }
    })
  }
}
