import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { settingsWorkspaceBillingCustomerPortalQuery } from '~/lib/settings/graphql/queries'
import type {
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { settingsBillingCancelCheckoutSessionMutation } from '~/lib/settings/graphql/mutations'

export const useBillingActions = () => {
  const { client: apollo } = useApolloClient()
  const { mutate: cancelCheckoutSessionMutation } = useMutation(
    settingsBillingCancelCheckoutSessionMutation
  )

  const billingPortalRedirect = async (workspaceId: string) => {
    // We need to fetch this on click because the link expires very quickly
    const result = await apollo.query({
      query: settingsWorkspaceBillingCustomerPortalQuery,
      variables: { workspaceId },
      fetchPolicy: 'no-cache'
    })

    if (result.data?.workspace.customerPortalUrl) {
      window.location.href = result.data.workspace.customerPortalUrl
    }
  }

  const upgradePlanRedirect = (args: {
    plan: WorkspacePlans
    cycle: BillingInterval
    workspaceId: string
  }) => {
    const { plan, cycle, workspaceId } = args
    window.location.href = `/api/v1/billing/workspaces/${workspaceId}/checkout-session/${plan}/${cycle}`
  }

  const cancelCheckoutSession = async (sessionId: string, workspaceId: string) => {
    await cancelCheckoutSessionMutation({
      input: { sessionId, workspaceId }
    })
  }

  return {
    billingPortalRedirect,
    upgradePlanRedirect,
    cancelCheckoutSession
  }
}
