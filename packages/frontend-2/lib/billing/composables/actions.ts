import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { settingsWorkspaceBillingCustomerPortalQuery } from '~/lib/settings/graphql/queries'
import type {
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { settingsBillingCancelCheckoutSessionMutation } from '~/lib/settings/graphql/mutations'
import { WorkspacePlanStatuses } from '~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useMixpanel } from '~/lib/core/composables/mp'

export const useBillingActions = () => {
  const mixpanel = useMixpanel()
  const route = useRoute()
  const router = useRouter()
  const { triggerNotification } = useGlobalToast()
  const { client: apollo } = useApolloClient()
  const { mutate: cancelCheckoutSessionMutation } = useMutation(
    settingsBillingCancelCheckoutSessionMutation
  )

  const billingPortalRedirect = async (workspaceId: string) => {
    mixpanel.track('Billing Portal Button Clicked', {
      // eslint-disable-next-line camelcase
      workspace_id: workspaceId
    })

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
    mixpanel.track('Upgrade Button Clicked', {
      plan,
      cycle,
      // eslint-disable-next-line camelcase
      workspace_id: workspaceId
    })
    window.location.href = `/api/v1/billing/workspaces/${workspaceId}/checkout-session/${plan}/${cycle}`
  }

  const cancelCheckoutSession = async (sessionId: string, workspaceId: string) => {
    await cancelCheckoutSessionMutation({
      input: { sessionId, workspaceId }
    })

    mixpanel.track('Checkout Session Cancelled', {
      // eslint-disable-next-line camelcase
      workspace_id: workspaceId
    })
  }

  const validateCheckoutSession = (workspaceId: string) => {
    const sessionIdQuery = route.query?.session_id
    const paymentStatusQuery = route.query?.payment_status

    if (sessionIdQuery && paymentStatusQuery) {
      if (paymentStatusQuery === WorkspacePlanStatuses.Canceled) {
        cancelCheckoutSession(String(sessionIdQuery), workspaceId)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Your payment was canceled'
        })
      } else {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Your workspace plan was successfully updated'
        })
      }

      const currentQueryParams = { ...route.query }
      delete currentQueryParams.session_id
      delete currentQueryParams.payment_status
      router.push({ query: currentQueryParams })
    }
  }

  return {
    billingPortalRedirect,
    upgradePlanRedirect,
    cancelCheckoutSession,
    validateCheckoutSession
  }
}
