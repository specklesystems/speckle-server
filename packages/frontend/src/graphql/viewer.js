import { gql } from '@apollo/client/core'

export const viewerShooterDataQuery = gql`
  query ViewerShooterData {
    commitObjectViewerState @client {
      shooter {
        health
      }
    }
  }
`
