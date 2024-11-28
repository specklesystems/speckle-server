import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { settingsWorkspaceBillingCustomerPortalQuery } from '~/lib/settings/graphql/queries'
import {
  billingCreateCheckoutSessionMutation,
  billingUpgradePlanMuation
} from '~/lib/billing/graphql/mutations'
import {
  type PaidWorkspacePlans,
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
    mixpanel.track('Workspace Billing Portal Button Clicked', {
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

  const redirectToCheckout = async (args: {
    plan: PaidWorkspacePlans
    cycle: BillingInterval
    workspaceId: string
  }) => {
    const { plan, cycle, workspaceId } = args
    mixpanel.track('Workspace Subscribe Button Clicked', {
      plan,
      cycle,
      // eslint-disable-next-line camelcase
      workspace_id: workspaceId
    })

    const result = await apollo
      .mutate({
        mutation: billingCreateCheckoutSessionMutation,
        variables: {
          input: {
            workspaceId,
            billingInterval: cycle,
            workspacePlan: plan
          }
        },
        fetchPolicy: 'no-cache'
      })
      .catch(convertThrowIntoFetchResult)

    if (result.data?.workspaceMutations.billing.createCheckoutSession) {
      window.location.href =
        result.data.workspaceMutations.billing.createCheckoutSession.url
    } else {
      const errMsg = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        description: errMsg
      })
    }
  }

  const upgradePlan = async (args: {
    plan: PaidWorkspacePlans
    cycle: BillingInterval
    workspaceId: string
  }) => {
    const { plan, cycle, workspaceId } = args
    mixpanel.track('Workspace Upgrade Button Clicked', {
      plan,
      cycle,
      // eslint-disable-next-line camelcase
      workspace_id: workspaceId
    })

    const result = await apollo
      .mutate({
        mutation: billingUpgradePlanMuation,
        variables: {
          input: {
            workspaceId,
            billingInterval: cycle,
            workspacePlan: plan
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result.data) {
      mixpanel.track('Workspace Upgraded', {
        plan,
        cycle,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace plan upgraded',
        description: `Your workspace is now on a ${
          cycle === BillingInterval.Yearly ? 'annual' : 'monthly'
        } ${plan} plan`
      })
    } else {
      const errMsg = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: errMsg
      })
    }
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
    redirectToCheckout,
    cancelCheckoutSession,
    validateCheckoutSession,
    upgradePlan
  }
}
