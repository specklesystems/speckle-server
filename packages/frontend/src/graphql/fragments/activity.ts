import { gql } from '@apollo/client/core'

export const activityMainFieldsFragment = gql`
  fragment ActivityMainFields on Activity {
    id
    actionType
    info
    userId
    streamId
    resourceId
    resourceType
    time
    message
  }
`

export const limitedCommitActivityFieldsFragment = gql`
  fragment LimitedCommitActivityFields on Activity {
    id
    info
    time
    userId
    message
  }
`
