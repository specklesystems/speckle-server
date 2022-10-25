declare module 'vue/types/vue' {
  import { Nullable } from '@/helpers/typeHelpers'

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

    $userId: () => Nullable<string>

    /**
     * Whether the client seems to be a mobile device. Note that this doesn't check for screen size, only
     * whether this is a mobile device.
     */
    $isMobile: () => boolean

    /**
     * Redirect to log in and redirect back to current page post-login
     */
    $loginAndSetRedirect: () => void

    /**
     * Check if auth token is stored in localStorage
     * @deprecated Use `isLoggedInQuery`/`isLoggedInMixin`/`useIsLoggedIn` instead
     */
    $loggedIn: () => boolean

    /**
     * Resolve a resourceId's type
     */
    $resourceType: typeof import('@/main/lib/viewer/core/helpers/resourceHelper').getResourceType
  }

  export interface VueConfiguration {
    /**
     * To enable VueApollov4 to work
     */
    globalProperties?: Record<string, unknown>
  }
}

export {}
