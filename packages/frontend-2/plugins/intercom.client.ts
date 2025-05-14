import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { watch, computed, ref } from 'vue'
import Intercom, { shutdown, show, hide, update } from '@intercom/messenger-js-sdk'
import { useApolloClient } from '@vue/apollo-composable'
import { navigationActiveWorkspaceQuery } from '~~/lib/navigation/graphql/queries'

const disabledRoutes = ['/auth', '/models/']

export const useIntercom = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { activeWorkspaceSlug } = useNavigation()
  const route = useRoute()
  const { activeUser: user } = useActiveUser()
  const apollo = useApolloClient().client

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
    if (!shouldEnableIntercom.value || !user.value || isInitialized.value) return
    isInitialized.value = true

    Intercom({
      /* eslint-disable camelcase */
      app_id: 'hoiaq4wn',
      user_id: user.value.id || undefined,
      created_at: user.value.createdAt
        ? Math.floor(new Date(user.value.createdAt).getTime() / 1000)
        : undefined,
      /* eslint-enable camelcase */
      name: user.value.name || undefined,
      email: user.value.email || undefined
    })

    updateCompany()
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

  const updateCompany = async () => {
    if (!activeWorkspaceSlug.value) return

    const workspace = await apollo.query({
      query: navigationActiveWorkspaceQuery,
      variables: {
        slug: activeWorkspaceSlug.value
      }
    })

    if (!workspace.data?.workspaceBySlug) return

    update({
      company: {
        id: workspace.data?.workspaceBySlug.id,
        name: workspace.data?.workspaceBySlug.name,
        plan: workspace.data?.workspaceBySlug.plan?.name
      }
    })
  }

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
