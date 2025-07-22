import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { settingsWorkspaceBillingCustomerPortalQuery } from '~/lib/settings/graphql/queries'
import {
  billingCreateCheckoutSessionMutation,
  billingUpgradePlanMuation
} from '~/lib/billing/graphql/mutations'
import {
  type PaidWorkspacePlans,
  BillingInterval,
  type BillingActions_WorkspaceFragment,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { settingsBillingCancelCheckoutSessionMutation } from '~/lib/settings/graphql/mutations'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { formatName } from '~/lib/billing/helpers/plan'

graphql(`
  fragment BillingActions_Workspace on Workspace {
    id
    name
    invitedTeam(filter: $invitesFilter) {
      id
    }
    plan {
      name
      status
    }
    subscription {
      billingInterval
    }
    team {
      totalCount
    }
    defaultRegion {
      name
    }
  }
`)

export const useBillingActions = () => {
  const mixpanel = useMixpanel()
  const route = useRoute()
  const router = useRouter()
  const { triggerNotification } = useGlobalToast()
  const { client: apollo } = useApolloClient()
  const { mutate: cancelCheckoutSessionMutation } = useMutation(
    settingsBillingCancelCheckoutSessionMutation
  )
  const logger = useLogger()
  const { $intercom } = useNuxtApp()

  const billingPortalRedirect = async (workspaceId: MaybeNullOrUndefined<string>) => {
    if (!workspaceId) {
      logger.error('[Billing Portal] No workspaceId provided, returning early')
      return
    }

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
      window.open(result.data.workspace.customerPortalUrl, '_blank')
    } else {
      logger.warn(
        '[Billing Portal] No portal URL returned, full response:',
        result.data
      )
    }
  }

  const redirectToCheckout = async (args: {
    plan: PaidWorkspacePlans
    cycle: BillingInterval
    workspaceId: string
    isCreateFlow?: boolean
  }) => {
    const { plan, cycle, workspaceId, isCreateFlow } = args

    const result = await apollo
      .mutate({
        mutation: billingCreateCheckoutSessionMutation,
        variables: {
          input: {
            workspaceId,
            billingInterval: cycle,
            workspacePlan: plan,
            isCreateFlow: !!isCreateFlow
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

    const result = await apollo
      .mutate({
        mutation: billingUpgradePlanMuation,
        variables: {
          input: {
            workspaceId,
            billingInterval: cycle,
            workspacePlan: plan
          }
        },
        update: (cache, res) => {
          const { data } = res
          if (!data?.workspaceMutations) return

          cache.modify({
            id: getCacheId('Workspace', workspaceId),
            fields: {
              plan: () => {
                return {
                  name: plan,
                  status: WorkspacePlanStatuses.Valid
                }
              },
              subscription: () => {
                return {
                  billingInterval: cycle
                }
              }
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result.data) {
      const metaData = {
        plan,
        cycle,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      }
      $intercom.track('Workspace Upgraded', {
        ...metaData,
        isExistingSubscription: true
      })
      $intercom.updateCompany({
        id: workspaceId,
        /* eslint-disable camelcase */
        plan_name: plan,
        plan_status: WorkspacePlanStatuses.Valid
        /* eslint-enable camelcase */
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace plan upgraded',
        description: `Your workspace is now on ${
          cycle === BillingInterval.Yearly ? 'an annual' : 'a monthly'
        } ${formatName(plan)} plan`
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

  const validateCheckoutSession = (workspace: BillingActions_WorkspaceFragment) => {
    const sessionIdQuery = route.query?.session_id
    const paymentStatusQuery = route.query?.payment_status

    if (sessionIdQuery && paymentStatusQuery) {
      if (paymentStatusQuery === WorkspacePlanStatuses.Canceled) {
        cancelCheckoutSession(String(sessionIdQuery), workspace.id)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Your payment was canceled'
        })

        mixpanel.track('Workspace Upgrade Cancelled', {
          // eslint-disable-next-line camelcase
          workspace_id: workspace.id
        })
      } else {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Your workspace plan was successfully updated'
        })

        const metaData = {
          plan: workspace.plan?.name,
          cycle: workspace.subscription?.billingInterval,
          // eslint-disable-next-line camelcase
          workspace_id: workspace.id
        }
        $intercom.track('Workspace Subscription Created')
        $intercom.track('Workspace Upgraded', {
          ...metaData,
          isExistingSubscription: false
        })
        $intercom.updateCompany({
          id: workspace.id,
          /* eslint-disable camelcase */
          plan_name: workspace.plan?.name,
          plan_status: workspace.plan?.status
          /* eslint-enable camelcase */
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
