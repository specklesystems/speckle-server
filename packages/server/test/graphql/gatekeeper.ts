import gql from 'graphql-tag'

export const getWorkspacePlanPrices = gql`
  query GetWorkspacePlanPrices {
    serverInfo {
      workspaces {
        planPrices {
          usd {
            team {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            teamUnlimited {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            pro {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            proUnlimited {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
          }
          gbp {
            team {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            teamUnlimited {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            pro {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
            proUnlimited {
              monthly {
                amount
                currency
              }
              yearly {
                amount
                currency
              }
            }
          }
        }
      }
    }
  }
`
