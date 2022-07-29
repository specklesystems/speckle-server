declare module 'vue/types/vue' {
  export interface Vue {
    /**
     * Mixpanel instance
     */
    $mixpanel: import('mixpanel-browser').OverridedMixpanel
    /**
     * Event bus, for sending & receiving events across the app
     */
    $eventHub: Vue

    /**
     * Trigger a toast notification
     */
    $triggerNotification(
      args: import('@/main/lib/core/helpers/eventHubHelper').NotificationEventPayload
    ): void

    /**
     * Redirect to log in and redirect back to current page post-login
     */
    $loginAndSetRedirect: () => void

    /**
     * Check if auth token is stored in localStorage
     * @deprecated Use `isLoggedInQuery`/`isLoggedInMixin` instead
     */
    $loggedIn: () => boolean
  }

  export interface VueConfiguration {
    /**
     * To enable VueApollov4 to work
     */
    globalProperties?: Record<string, unknown>
  }
}

export {}
