import { useOnAuthStateChange } from '~/lib/auth/composables/auth'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { watch } from 'vue'

declare global {
  interface Window {
    Intercom: {
      (
        command: 'boot',
        options: {
          app_id: string
          user_id?: string
          created_at?: number
          name?: string
          email?: string
          company?: {
            id: string
            name: string
            plan?: string
          }
        }
      ): void
      (
        command: 'update',
        options: {
          company?: {
            id: string
            name: string
            plan?: string
          }
        }
      ): void
      (command: 'shutdown'): void
      (command: 'show'): void
      (command: 'hide'): void
    }
  }
}

export default defineNuxtPlugin(() => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { activeWorkspaceData } = useNavigation()

  // Only initialize Intercom if workspaces are enabled
  if (!isWorkspacesEnabled.value) return

  // Initialize Intercom with auth state changes
  useOnAuthStateChange()(
    async (user) => {
      if (typeof window.Intercom !== 'function') {
        // eslint-disable-next-line no-console
        console.warn('Intercom not initialized')
        return
      }

      if (user) {
        // Boot Intercom with user data when user is authenticated
        window.Intercom('boot', {
          /* eslint-disable camelcase */
          app_id: 'hoiaq4wn',
          user_id: user.id || undefined,
          created_at: user.createdAt
            ? Math.floor(new Date(user.createdAt).getTime() / 1000)
            : undefined,
          /* eslint-enable camelcase */
          name: user.name || undefined,
          email: user.email || undefined,
          company: activeWorkspaceData.value
            ? {
                id: activeWorkspaceData.value.id,
                name: activeWorkspaceData.value.name,
                plan: activeWorkspaceData.value.plan?.name
              }
            : undefined
        })
      } else {
        // Shutdown Intercom when user logs out
        window.Intercom('shutdown')
      }
    },
    { immediate: true }
  )

  // Watch for changes in active workspace and update Intercom
  watch(
    () => activeWorkspaceData.value,
    (newWorkspace) => {
      if (typeof window.Intercom !== 'function') return

      window.Intercom('update', {
        company: newWorkspace
          ? {
              id: newWorkspace.id,
              name: newWorkspace.name,
              plan: newWorkspace.plan?.name
            }
          : undefined
      })
    }
  )
})
