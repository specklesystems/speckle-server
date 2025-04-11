import { WorkspacePlanBillingIntervals, type PaidWorkspacePlans } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

const workspacePlanPricesQuery = graphql(`
  query UseWorkspacePlanPrices {
    serverInfo {
      workspaces {
        planPrices {
          id
          monthly {
            amount
            currencySymbol
          }
          yearly {
            amount
            currencySymbol
          }
        }
      }
    }
  }
`)

type WorkspacePlanPrices = {
  [plan in PaidWorkspacePlans]: {
    [interval in WorkspacePlanBillingIntervals]?: {
      amount: number
      currencySymbol: string
    }
  }
}

export const useWorkspacePlanPrices = () => {
  const isBillingEnabled = useIsBillingIntegrationEnabled()
  const { result } = useQuery(workspacePlanPricesQuery, undefined, () => ({
    enabled: isBillingEnabled.value
  }))

  const prices = computed(() => {
    const base = result.value?.serverInfo?.workspaces?.planPrices
    if (!base) return undefined

    return Object.fromEntries(
      base.map(({ id, monthly, yearly }) => [
        id,
        {
          ...(monthly ? { [WorkspacePlanBillingIntervals.Monthly]: monthly } : {}),
          ...(yearly ? { [WorkspacePlanBillingIntervals.Yearly]: yearly } : {})
        }
      ])
    ) as WorkspacePlanPrices
  })

  return { prices }
}
