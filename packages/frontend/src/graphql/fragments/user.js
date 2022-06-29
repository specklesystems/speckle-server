import gql from 'graphql-tag'

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
  }
`
