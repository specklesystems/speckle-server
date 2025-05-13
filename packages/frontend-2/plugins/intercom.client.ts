import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useIsWorkspacesEnabled } from '~/composables/globals'
// import { useNavigation } from '~/lib/navigation/composables/navigation'
// import { watch } from 'vue'
import Intercom, { shutdown, show, hide } from '@intercom/messenger-js-sdk'

export const useIntercom = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  useOnAuthStateChange()(
    (user, { isReset }) => {
      if (!import.meta.client) return

      if (isReset) {
        shutdownIntercom()
      } else if (user) {
        Intercom({
          /* eslint-disable camelcase */
          app_id: 'hoiaq4wn',
          user_id: user.id || undefined,
          created_at: user.createdAt
            ? Math.floor(new Date(user.createdAt).getTime() / 1000)
            : undefined,
          /* eslint-enable camelcase */
          name: user.name || undefined,
          email: user.email || undefined
          // company: activeWorkspaceData.value
          //   ? {
          //       id: activeWorkspaceData.value.id,
          //       name: activeWorkspaceData.value.name,
          //       plan: activeWorkspaceData.value.plan?.name
          //     }
          //   : undefined
        })
      }
    },
    { immediate: true }
  )

  const showIntercom = () => {
    if (!isWorkspacesEnabled.value) return
    show()
  }

  const hideIntercom = () => {
    if (!isWorkspacesEnabled.value) return
    hide()
  }

  const shutdownIntercom = () => {
    if (!isWorkspacesEnabled.value) return
    shutdown()
  }

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
