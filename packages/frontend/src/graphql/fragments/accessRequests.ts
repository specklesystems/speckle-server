import { limitedUserFieldsFragment } from '@/graphql/fragments/user'
import { gql } from '@apollo/client/core'

export const basicStreamAccessRequestFieldsFragment = gql`
  fragment BasicStreamAccessRequestFields on StreamAccessRequest {
    id
    streamId
    createdAt
  }
`

export const fullStreamAccessRequestFieldsFragment = gql`
  fragment FullStreamAccessRequestFields on StreamAccessRequest {
    ...BasicStreamAccessRequestFields
    requester {
      ...LimitedUserFields
    }
  }

  ${limitedUserFieldsFragment}
  ${basicStreamAccessRequestFieldsFragment}
`
