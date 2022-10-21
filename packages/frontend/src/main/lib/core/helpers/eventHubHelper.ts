/**
 * EVENT BRIDGE/BUS EVENTS
 */

export type ToastNotificationType = 'primary' | 'success' | 'error'

export type NotificationEventPayload = {
  text: string
  action?: { name: string; to: string }
  type?: ToastNotificationType
}

/**
 * Global app events
 */
export const GlobalEvents = Object.freeze({
  /**
   * For emitting a global toast notification
   */
  Notification: 'notification',
  /**
   * Emits 'true' when moving to a new route and 'false' once loading is done
   */
  PageLoading: 'page-load'
})

/**
 * Stream page events
 */
export const StreamEvents = Object.freeze({
  /**
   * For triggering a refetch of main stream data
   */
  Refetch: 'stream:refetch',

  /**
   * For triggering a refetch of stream collaborator data
   */
  RefetchCollaborators: 'stream:refetch:collaborators',

  /**
   * For triggering a refetch of stream branch data
   */
  RefetchBranches: 'stream:refetch:branches'
})
