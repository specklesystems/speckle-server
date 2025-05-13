import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useIsWorkspacesEnabled } from '~/composables/globals'
// import { useNavigation } from '~/lib/navigation/composables/navigation'
import { watch, computed } from 'vue'
import Intercom, { shutdown, show, hide } from '@intercom/messenger-js-sdk'

// Routes where Intercom should never be enabled
const intercomDisabledRoutes = ['/auth', '/models/']

export const useIntercom = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const route = useRoute()
  const { activeUser: user } = useActiveUser()

  const isInitialized = ref(false)

  useOnAuthStateChange()(
    ({ isReset }) => {
      if (isReset) {
        shutdownIntercom()
      } else if (user) {
        bootIntercom()
      }
    },
    { immediate: true }
  )

  const isRouteBlacklisted = computed(() => {
    return intercomDisabledRoutes.some((disabledRoute) =>
      route.path.includes(disabledRoute)
    )
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
      // company: activeWorkspaceData.value
      //   ? {
      //       id: activeWorkspaceData.value.id,
      //       name: activeWorkspaceData.value.name,
      //       plan: activeWorkspaceData.value.plan?.name
      //     }
      //   : undefined
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

  watch(route, () => {
    if (isRouteBlacklisted.value) {
      shutdownIntercom()
    } else {
      bootIntercom()
    }
  })

  // watch(
  //   () => activeWorkspaceData.value,
  //   (newWorkspace) => {
  //     if (!isInitialized.value || !import.meta.client) return

  //     update({
  //       company: newWorkspace
  //         ? {
  //             id: newWorkspace.id,
  //             name: newWorkspace.name,
  //             plan: newWorkspace.plan?.name
  //           }
  //         : undefined
  //     })
  //   },
  //   { deep: true }
  // )

  return {
    show: showIntercom,
    hide: hideIntercom,
    shutdown: shutdownIntercom
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      intercom: useIntercom()
    }
  }
})
