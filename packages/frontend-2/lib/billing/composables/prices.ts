import {
  Roles,
  WorkspaceGuestSeatType,
  WorkspacePlanBillingIntervals,
  type PaidWorkspacePlans,
  type WorkspaceRoles
} from '@speckle/shared'
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
      [role in WorkspaceRoles]: {
        amount: number
        currencySymbol: string
      }
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
    const guestSeatPrices = base.find((p) => p.id === 'guest')

    return base.reduce((acc, price) => {
      if (price.id === WorkspaceGuestSeatType) return acc

      acc[price.id as keyof WorkspacePlanPrices] = {
        ...(price.monthly
          ? {
              [WorkspacePlanBillingIntervals.Monthly]: {
                [Roles.Workspace.Guest]: guestSeatPrices?.monthly || price.monthly,
                [Roles.Workspace.Member]: price.monthly,
                [Roles.Workspace.Admin]: price.monthly
              }
            }
          : {}),
        ...(price.yearly
          ? {
              [WorkspacePlanBillingIntervals.Yearly]: {
                [Roles.Workspace.Guest]: guestSeatPrices?.yearly || price.yearly,
                [Roles.Workspace.Member]: price.yearly,
                [Roles.Workspace.Admin]: price.yearly
              }
            }
          : {})
      }
      return acc
    }, {} as WorkspacePlanPrices)
  })

  return { prices }
}
