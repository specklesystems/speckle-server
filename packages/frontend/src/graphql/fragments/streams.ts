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

export const streamFileUploadFragment = gql`
  fragment StreamFileUpload on FileUpload {
    id
    convertedCommitId
    userId
    convertedStatus
    convertedMessage
    fileName
    fileType
    uploadComplete
    uploadDate
    convertedLastUpdate
  }
`
