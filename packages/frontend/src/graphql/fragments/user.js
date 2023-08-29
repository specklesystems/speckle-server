import { gql } from '@apollo/client/core'

export const limitedUserFieldsFragment = gql`
  fragment LimitedUserFields on LimitedUser {
    id
    name
    bio
    company
    avatar
    verified
  }
`

export const streamCollaboratorFieldsFragment = gql`
  fragment StreamCollaboratorFields on StreamCollaborator {
    id
    name
    role
    company
    avatar
    serverRole
  }
`

export const usersOwnInviteFieldsFragment = gql`
  fragment UsersOwnInviteFields on PendingStreamCollaborator {
    id
    inviteId
    streamId
    streamName
    token
    invitedBy {
      ...LimitedUserFields
    }
  }

  ${limitedUserFieldsFragment}
`
