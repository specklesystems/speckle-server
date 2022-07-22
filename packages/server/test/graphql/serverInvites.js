const { gql } = require('apollo-server-express')

/**
 * @typedef {{
 *  email: string,
 *  message: string | null
 * }} ServerInviteCreateInput
 */

/**
 * @typedef {{
 *  email: string | null,
 *  userId: string | null,
 *  streamId: string,
 *  message: string,
 *  role: string | null
 * }} StreamInviteCreateInput
 */

const createServerInviteMutation = gql`
  mutation ($input: ServerInviteCreateInput!) {
    serverInviteCreate(input: $input)
  }
`

const createStreamInviteMutation = gql`
  mutation ($input: StreamInviteCreateInput!) {
    streamInviteCreate(input: $input)
  }
`

const resendInviteMutation = gql`
  mutation ($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`

const batchCreateServerInviteMutation = gql`
  mutation ($input: [ServerInviteCreateInput!]!) {
    serverInviteBatchCreate(input: $input)
  }
`

const batchCreateStreamInviteMutation = gql`
  mutation ($input: [StreamInviteCreateInput!]!) {
    streamInviteBatchCreate(input: $input)
  }
`

const deleteInviteMutation = gql`
  mutation ($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`

const streamInviteFragment = gql`
  fragment StreamInviteData on PendingStreamCollaborator {
    id
    inviteId
    streamId
    title
    role
    invitedBy {
      id
      name
      bio
      company
      avatar
      verified
    }
    user {
      id
      name
      bio
      company
      avatar
      verified
    }
  }
`

const streamInviteQuery = gql`
  query ($streamId: String!, $token: String) {
    streamInvite(streamId: $streamId, token: $token) {
      ...StreamInviteData
    }
  }

  ${streamInviteFragment}
`

const streamInvitesQuery = gql`
  query {
    streamInvites {
      ...StreamInviteData
    }
  }

  ${streamInviteFragment}
`

const useStreamInviteMutation = gql`
  mutation ($accept: Boolean!, $streamId: String!, $token: String!) {
    streamInviteUse(accept: $accept, streamId: $streamId, token: $token)
  }
`

const cancelStreamInviteMutation = gql`
  mutation ($streamId: String!, $inviteId: String!) {
    streamInviteCancel(streamId: $streamId, inviteId: $inviteId)
  }
`

const streamPendingCollaboratorsQuery = gql`
  query ($streamId: String!) {
    stream(id: $streamId) {
      id
      pendingCollaborators {
        inviteId
        title
        user {
          id
          name
        }
      }
    }
  }
`

module.exports = {
  /**
   * serverInviteCreate mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   * @param {ServerInviteCreateInput} input
   */
  createServerInvite(apollo, input) {
    return apollo.executeOperation({
      query: createServerInviteMutation,
      variables: {
        input
      }
    })
  },
  /**
   * streamInviteCreate mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   * @param {StreamInviteCreateInput} input
   */
  createStreamInvite(apollo, input) {
    return apollo.executeOperation({
      query: createStreamInviteMutation,
      variables: {
        input
      }
    })
  },
  /**
   * serverInviteBatchCreate mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  batchCreateServerInvites(apollo, { message, emails }) {
    return apollo.executeOperation({
      query: batchCreateServerInviteMutation,
      variables: {
        input: emails.map((e) => ({
          email: e,
          message
        }))
      }
    })
  },
  /**
   * serverInviteBatchCreate mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   * @param {StreamInviteCreateInput[]} inputs
   */
  batchCreateStreamInvites(apollo, inputs) {
    return apollo.executeOperation({
      query: batchCreateStreamInviteMutation,
      variables: {
        input: inputs
      }
    })
  },
  /**
   * inviteResend mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  resendInvite(apollo, { inviteId }) {
    return apollo.executeOperation({
      query: resendInviteMutation,
      variables: {
        inviteId
      }
    })
  },
  /**
   * inviteDelete mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  deleteInvite(apollo, { inviteId }) {
    return apollo.executeOperation({
      query: deleteInviteMutation,
      variables: {
        inviteId
      }
    })
  },
  /**
   * streamInvite query
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  getStreamInvite(apollo, { streamId, token }) {
    return apollo.executeOperation({
      query: streamInviteQuery,
      variables: { streamId, token }
    })
  },
  /**
   * streamInvites query
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  getStreamInvites(apollo) {
    return apollo.executeOperation({
      query: streamInvitesQuery
    })
  },
  /**
   * streamInviteUse mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  useUpStreamInvite(apollo, { accept, streamId, token }) {
    return apollo.executeOperation({
      query: useStreamInviteMutation,
      variables: { accept, streamId, token }
    })
  },
  /**
   * streamInviteCancel mutation
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  cancelStreamInvite(apollo, { streamId, inviteId }) {
    return apollo.executeOperation({
      query: cancelStreamInviteMutation,
      variables: { streamId, inviteId }
    })
  },
  /**
   * stream query w/ a focus on pendingCollaborators
   * @param {import('apollo-server-express').ApolloServer} apollo
   */
  getStreamPendingCollaborators(apollo, { streamId }) {
    return apollo.executeOperation({
      query: streamPendingCollaboratorsQuery,
      variables: { streamId }
    })
  }
}
