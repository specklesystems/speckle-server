import { graphql } from '~/lib/common/generated/gql'

export const intercomActiveWorkspaceQuery = graphql(`
  query IntercomActiveWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      plan {
        name
        status
      }
      planPrices {
        team {
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
        teamUnlimited {
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
        pro {
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
        proUnlimited {
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
      subscription {
        billingInterval
      }
      seats {
        editors {
          assigned
          available
        }
      }
    }
  }
`)
