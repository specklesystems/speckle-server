import gql from 'graphql-tag'

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

export const getOwnProjectInvitesQuery = gql`
  query GetOwnProjectInvites {
    activeUser {
      projectInvites {
        ...StreamInviteData
      }
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

export const createProjectInviteMutation = gql`
  mutation CreateProjectInvite($projectId: ID!, $input: ProjectInviteCreateInput!) {
    projectMutations {
      invites {
        create(projectId: $projectId, input: $input) {
          id
        }
      }
    }
  }
`
