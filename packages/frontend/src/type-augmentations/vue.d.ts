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
  }
}

export {}
