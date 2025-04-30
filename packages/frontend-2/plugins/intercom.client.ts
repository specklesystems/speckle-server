import { useOnAuthStateChange } from '~/lib/auth/composables/auth'

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
        }
      ): void
      (command: 'shutdown'): void
      (command: 'update'): void
      (command: 'show'): void
      (command: 'hide'): void
      (command: 'showNewMessage', message?: string): void
    }
  }
}

export default defineNuxtPlugin(() => {
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
          email: user.email || undefined
        })
      } else {
        // Shutdown Intercom when user logs out
        window.Intercom('shutdown')
      }
    },
    { immediate: true }
  )
})
