import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment PricesPrice on Price {
    amount
    currencySymbol
    currency
  }
`)

graphql(`
  fragment PricesWorkspacePlanPrice on WorkspacePlanPrice {
    monthly {
      ...PricesPrice
    }
    yearly {
      ...PricesPrice
    }
  }
`)

graphql(`
  fragment PricesWorkspacePaidPlanPrices on WorkspacePaidPlanPrices {
    team {
      ...PricesWorkspacePlanPrice
    }
    teamUnlimited {
      ...PricesWorkspacePlanPrice
    }
    pro {
      ...PricesWorkspacePlanPrice
    }
    proUnlimited {
      ...PricesWorkspacePlanPrice
    }
  }
`)

graphql(`
  fragment PricesCurrencyBasedPrices on CurrencyBasedPrices {
    gbp {
      ...PricesWorkspacePaidPlanPrices
    }
    usd {
      ...PricesWorkspacePaidPlanPrices
    }
  }
`)

const workspacePlanPricesQuery = graphql(`
  query UseWorkspacePlanPrices {
    serverInfo {
      workspaces {
        planPrices {
          ...PricesCurrencyBasedPrices
        }
      }
    }
  }
`)

const activeWorkspacePlanPricesQuery = graphql(`
  query UseActiveWorkspacePlanPrices {
    activeUser {
      activeWorkspace {
        planPrices {
          ...PricesWorkspacePaidPlanPrices
        }
      }
    }
  }
`)

export const useWorkspacePlanPrices = () => {
  const isBillingEnabled = useIsBillingIntegrationEnabled()
  const { result } = useQuery(workspacePlanPricesQuery, undefined, () => ({
    enabled: isBillingEnabled.value
  }))

  const prices = computed(() => result.value?.serverInfo?.workspaces?.planPrices)

  return { prices }
}

export const useActiveWorkspacePlanPrices = () => {
  const isBillingEnabled = useIsBillingIntegrationEnabled()
  const { result } = useQuery(activeWorkspacePlanPricesQuery, undefined, () => ({
    enabled: isBillingEnabled.value
  }))

  const prices = computed(() => result.value?.activeUser?.activeWorkspace?.planPrices)

  return { prices }
}
