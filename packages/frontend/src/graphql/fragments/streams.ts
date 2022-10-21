import { fullStreamAccessRequestFieldsFragment } from '@/graphql/fragments/accessRequests'
import { gql } from '@apollo/client/core'

export const streamPendingAccessRequestsFragment = gql`
  fragment StreamPendingAccessRequests on Stream {
    pendingAccessRequests {
      ...FullStreamAccessRequestFields
    }
  }

  ${fullStreamAccessRequestFieldsFragment}
`
