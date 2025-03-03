import gql from 'graphql-tag'

export const getWorkspacePlanPrices = gql`
  query GetWorkspacePlanPrices {
    serverInfo {
      workspaces {
        planPrices {
          id
          monthly {
            amount
            currency
            currencySymbol
          }
          yearly {
            amount
            currency
            currencySymbol
          }
        }
      }
    }
  }
`
