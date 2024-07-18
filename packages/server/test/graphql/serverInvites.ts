import { gql } from 'apollo-server-express'

export const createServerInviteMutation = gql`
  mutation CreateServerInvite($input: ServerInviteCreateInput!) {
    serverInviteCreate(input: $input)
  }
`

export const createStreamInviteMutation = gql`
  mutation CreateStreamInvite($input: StreamInviteCreateInput!) {
    streamInviteCreate(input: $input)
  }
`

export const resendInviteMutation = gql`
  mutation ResendInvite($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`

export const batchCreateServerInviteMutation = gql`
  mutation BatchCreateServerInvite($input: [ServerInviteCreateInput!]!) {
    serverInviteBatchCreate(input: $input)
  }
`

export const batchCreateStreamInviteMutation = gql`
  mutation BatchCreateStreamInvite($input: [StreamInviteCreateInput!]!) {
    streamInviteBatchCreate(input: $input)
  }
`

export const deleteInviteMutation = gql`
  mutation DeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`

export const streamInviteFragment = gql`
  fragment StreamInviteData on PendingStreamCollaborator {
    id
    inviteId
    streamId
    title
    role
    token
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

export const streamInviteQuery = gql`
  query GetStreamInvite($streamId: String!, $token: String) {
    streamInvite(streamId: $streamId, token: $token) {
      ...StreamInviteData
    }
  }

  ${streamInviteFragment}
`

export const streamInvitesQuery = gql`
  query GetStreamInvites {
    streamInvites {
      ...StreamInviteData
    }
  }

  ${streamInviteFragment}
`

export const useStreamInviteMutation = gql`
  mutation UseStreamInvite($accept: Boolean!, $streamId: String!, $token: String!) {
    streamInviteUse(accept: $accept, streamId: $streamId, token: $token)
  }
`

export const cancelStreamInviteMutation = gql`
  mutation CancelStreamInvite($streamId: String!, $inviteId: String!) {
    streamInviteCancel(streamId: $streamId, inviteId: $inviteId)
  }
`

export const streamPendingCollaboratorsQuery = gql`
  query GetStreamPendingCollaborators($streamId: String!) {
    stream(id: $streamId) {
      id
      pendingCollaborators {
        inviteId
        title
        token
        user {
          id
          name
        }
      }
    }
  }
`

// /**
//    * serverInviteCreate mutation

//    */
// export const createServerInvite = async (
//   apollo: ApolloServer,
//   input: ServerInviteCreateInput
// ) => {
//   const res = await apollo.executeOperation({
//     query: createServerInviteMutation,
//     variables: {
//       input
//     }
//   })
//   return res
// }

// /**
//  * streamInviteCreate mutation
//  */
// export const createStreamInvite = (
//   apollo: ApolloServer,
//   input: StreamInviteCreateInput
// ) => {
//   return apollo.executeOperation({
//     query: createStreamInviteMutation,
//     variables: {
//       input
//     }
//   })
// }

// /**
//  * serverInviteBatchCreate mutation
//  */
// export const batchCreateServerInvites = (
//   apollo: ApolloServer,
//   { message, emails }: { message: string; emails: string[] }
// ) => {
//   return apollo.executeOperation({
//     query: batchCreateServerInviteMutation,
//     variables: {
//       input: emails.map((e) => ({
//         email: e,
//         message
//       }))
//     }
//   })
// }

// /**
//  * serverInviteBatchCreate mutation
//  */
// export const batchCreateStreamInvites = (
//   apollo: ApolloServer,
//   inputs: StreamInviteCreateInput[]
// ) => {
//   return apollo.executeOperation({
//     query: batchCreateStreamInviteMutation,
//     variables: {
//       input: inputs
//     }
//   })
// }

// /**
//  * inviteResend mutation
//  */
// export const resendInvite = (
//   apollo: ApolloServer,
//   { inviteId }: { inviteId: string }
// ) => {
//   return apollo.executeOperation({
//     query: resendInviteMutation,
//     variables: {
//       inviteId
//     }
//   })
// }

// /**
//  * inviteDelete mutation
//  */
// export const deleteInvite = (
//   apollo: ApolloServer,
//   { inviteId }: { inviteId: string }
// ) => {
//   return apollo.executeOperation({
//     query: deleteInviteMutation,
//     variables: {
//       inviteId
//     }
//   })
// }

// /**
//  * streamInvite query
//  */
// export const getStreamInvite = (
//   apollo: ApolloServer,
//   { streamId, token }: { streamId: string; token?: string }
// ) => {
//   return apollo.executeOperation({
//     query: streamInviteQuery,
//     variables: { streamId, token }
//   })
// }

// /**
//  * streamInvites query
//  */
// export const getStreamInvites = (apollo: ApolloServer) => {
//   return apollo.executeOperation({
//     query: streamInvitesQuery
//   })
// }

// /**
//  * streamInviteUse mutation
//  */
// export const useUpStreamInvite = (
//   apollo: ApolloServer,
//   { accept, streamId, token }: { accept: boolean; streamId: string; token: string }
// ) => {
//   return apollo.executeOperation({
//     query: useStreamInviteMutation,
//     variables: { accept, streamId, token }
//   })
// }

// /**
//  * streamInviteCancel mutation
//  */
// export const cancelStreamInvite = (
//   apollo: ApolloServer,
//   { streamId, inviteId }: { streamId: string; inviteId: string }
// ) => {
//   return apollo.executeOperation({
//     query: cancelStreamInviteMutation,
//     variables: { streamId, inviteId }
//   })
// }

// /**
//  * stream query w/ a focus on pendingCollaborators
//  */
// export const getStreamPendingCollaborators = (
//   apollo: ApolloServer,
//   { streamId }: { streamId: string }
// ) => {
//   return apollo.executeOperation({
//     query: streamPendingCollaboratorsQuery,
//     variables: { streamId }
//   })
// }
