import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import Intercom, {
  shutdown,
  show,
  hide,
  update,
  trackEvent,
  onShow
} from '@intercom/messenger-js-sdk'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useIntercomEnabled } from '~/lib/intercom/composables/enabled'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'
import { intercomActiveWorkspaceQuery } from '~/lib/intercom/graphql/queries'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import { estimatedMonthlySpend } from '~/lib/intercom/helpers/billing'

export const useIntercom = () => {
  const {
    public: { intercomAppId }
  } = useRuntimeConfig()

  if (!intercomAppId) {
    // Return empty functions if Intercom is not configured
    return {
      show: () => {},
      hide: () => {},
      shutdown: () => {},
      track: () => {},
      updateCompany: () => {}
    }
  }

  const { activeUser: user } = useActiveUser()
  const { isIntercomEnabled, isRouteBlacklisted } = useIntercomEnabled()
  const route = useRoute()
  const activeWorkspaceSlug = useActiveWorkspaceSlug()
  const apolloClient = useApolloClientFromNuxt()

  const isInitialized = ref(false)

  useOnAuthStateChange()(
    (_user, { isReset }) => {
      if (isReset) {
        shutdownIntercom()
      } else if (user.value) {
        bootIntercom()
      }
    },
    { immediate: true }
  )

  const bootIntercom = () => {
    if (
      !isIntercomEnabled.value ||
      isRouteBlacklisted.value ||
      !user.value ||
      isInitialized.value
    )
      return
    isInitialized.value = true

    // Hide default launcher on viewer routes (/models/)
    const isViewerRoute = route.path.includes('/models/')
    const isPresentationRoute = route.path.includes('/presentations/')

    Intercom({
      /* eslint-disable camelcase */
      app_id: intercomAppId,
      user_id: user.value.id || '',
      created_at: Math.floor(new Date(user.value.createdAt || '').getTime() / 1000),
      hide_default_launcher: isViewerRoute || isPresentationRoute,
      /* eslint-enable camelcase */
      name: user.value.name || '',
      email: user.value.email || ''
    })

    onShow(async () => {
      try {
        const result = await apolloClient.query({
          query: intercomActiveWorkspaceQuery,
          variables: {
            slug: activeWorkspaceSlug.value || ''
          }
        })

        if (result.data) {
          const editorSeatCount =
            result.data.workspaceBySlug.seats?.editors.assigned ||
            0 + (result.data.workspaceBySlug.seats?.editors.available || 0)
          updateCompany({
            id: result.data.workspaceBySlug.id,
            /* eslint-disable camelcase */
            plan_name: result.data.workspaceBySlug.plan?.name,
            plan_status: result.data.workspaceBySlug.plan?.status,
            estimated_monthly_spend: estimatedMonthlySpend({
              planName: result.data.workspaceBySlug.plan?.name,
              interval: result.data.workspaceBySlug.subscription?.billingInterval,
              prices: result.data.workspaceBySlug.planPrices,
              seats: editorSeatCount
            }),
            editor_seat_count: editorSeatCount
            /* eslint-enable camelcase */
          })
        }
      } catch {
        // Silently fail - we don't want Intercom initialization to break
      }
    })
  }

  const showIntercom = () => {
    if (!isInitialized.value) return
    show()
  }

  const hideIntercom = () => {
    if (!isInitialized.value) return
    hide()
  }

  const shutdownIntercom = () => {
    if (!isInitialized.value) return
    shutdown()
    isInitialized.value = false
  }

  const trackIntercom = (event: string, metadata?: Record<string, unknown>) => {
    if (!isInitialized.value) return
    trackEvent(event, metadata)
  }

  // Update the 'company' (workspace) in Intercom with additional data
  const updateCompany = async (
    data: { id: string } & Record<string, MaybeNullOrUndefined<string | number>> = {
      id: ''
    }
  ) => {
    update({
      company: {
        ...data
      }
    })
  }

  // Update launcher visibility based on current route
  const updateLauncherVisibility = () => {
    if (!isInitialized.value) return

    const isViewerRoute = route.path.includes('/models/')
    const isPresentationRoute = route.path.includes('/presentations/')

    update({
      /* eslint-disable camelcase */
      hide_default_launcher: isViewerRoute || isPresentationRoute
      /* eslint-enable camelcase */
    })
  }

  // On route change, check if we need to shutdown or boot Intercom
  watch(route, () => {
    if (isRouteBlacklisted.value) {
      shutdownIntercom()
    } else {
      bootIntercom()
      updateLauncherVisibility()
    }
  })

  return {
    show: showIntercom,
    hide: hideIntercom,
    shutdown: shutdownIntercom,
    track: trackIntercom,
    updateCompany
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      intercom: useIntercom()
    }
  }
})
