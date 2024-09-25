import { BaseError } from '@/modules/shared/errors/base'

export class UnhandledNotificationError extends BaseError {
  static code = 'UNHANDLED_NOTIFICATION_ERROR'
  static defaultMessage = 'A notification without a valid handler has arrived'
  static statusCode = 500
}

export class InvalidNotificationError extends BaseError {
  static code = 'INVALID_NOTIFICATION_ERROR'
  static defaultMessage = 'Received an invalid notification'
  static statusCode = 500
}

/**
 * If this notification is thrown from a notification handler, the error will be logged, but
 * the notification will be acknowledged and not re-queued
 */
export class NotificationValidationError extends BaseError {
  static code = 'NOTIFICATION_VALIDATION_ERROR'
  static defaultMessage = 'Processing a notification failed due to invalid metadata'
  static statusCode = 500
}
