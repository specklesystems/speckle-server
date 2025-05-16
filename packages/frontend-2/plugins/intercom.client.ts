import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { watch, computed, ref } from 'vue'
import Intercom, { shutdown, show, hide, update } from '@intercom/messenger-js-sdk'
import { useApolloClient } from '@vue/apollo-composable'
import { intercomActiveWorkspaceQuery } from '~~/lib/intercom/graphql/queries'

const disabledRoutes = ['/auth', '/models/']

export const useIntercom = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { activeWorkspaceSlug } = useNavigation()
  const route = useRoute()
  const { activeUser: user } = useActiveUser()
  const apollo = useApolloClient().client
  const {
    public: { intercomAppId }
  } = useRuntimeConfig()

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

  const isRouteBlacklisted = computed(() => {
    return disabledRoutes.some((disabledRoute) => route.path.includes(disabledRoute))
  })

  const shouldEnableIntercom = computed(
    () => isWorkspacesEnabled.value && !isRouteBlacklisted.value
  )

  const bootIntercom = () => {
    if (
      !shouldEnableIntercom.value ||
      !user.value ||
      isInitialized.value ||
      !intercomAppId
    )
      return
    isInitialized.value = true

    Intercom({
      /* eslint-disable camelcase */
      app_id: intercomAppId,
      user_id: user.value.id || '',
      created_at: Math.floor(new Date(user.value.createdAt || '').getTime() / 1000),
      /* eslint-enable camelcase */
      name: user.value.name || '',
      email: user.value.email || ''
    })

    updateCompany()
  }

  const showIntercom = () => {
    if (!isInitialized.value) {
      throw new Error('Intercom is not initialized')
    }
    show()
  }

  const hideIntercom = () => {
    if (!isInitialized.value) {
      throw new Error('Intercom is not initialized')
    }
    hide()
  }

  const shutdownIntercom = () => {
    if (!isInitialized.value) {
      throw new Error('Intercom is not initialized')
    }
    shutdown()
    isInitialized.value = false
  }

  // Fetch active workspace and add to the user as a company
  const updateCompany = async () => {
    if (!activeWorkspaceSlug.value) return

    const workspace = await apollo.query({
      query: intercomActiveWorkspaceQuery,
      variables: {
        slug: activeWorkspaceSlug.value
      }
    })

    if (!workspace.data?.workspaceBySlug) return

    update({
      company: {
        id: workspace.data?.workspaceBySlug.id,
        name: workspace.data?.workspaceBySlug.name,
        people: workspace.data?.workspaceBySlug.team?.totalCount,
        /* eslint-disable camelcase */
        plan_name: workspace.data?.workspaceBySlug.plan?.name,
        plan_status: workspace.data?.workspaceBySlug.plan?.status,
        subscription_created_at:
          workspace.data?.workspaceBySlug.subscription?.createdAt,
        subscription_updated_at:
          workspace.data?.workspaceBySlug.subscription?.updatedAt,
        subscription_current_billing_cycle_end:
          workspace.data?.workspaceBySlug.subscription?.currentBillingCycleEnd
        /* eslint-enable camelcase */
      }
    })
  }

  // On route change, check if we need to shutodwn or boot Intercom
  watch(route, () => {
    if (isRouteBlacklisted.value) {
      shutdownIntercom()
    } else {
      bootIntercom()
    }
  })

  watch(
    () => activeWorkspaceSlug.value,
    async () => {
      if (!isInitialized.value) return
      updateCompany()
    }
  )

  return {
    show: showIntercom,
    hide: hideIntercom,
    shutdown: shutdownIntercom,
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
