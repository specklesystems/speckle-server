import { BaseError } from '@/modules/shared/errors'

export class WebhookCreationError extends BaseError {
  static defaultMessage = 'Error creating webhook'
  static code = 'WEBHOOK_CREATION_ERROR'
  static statusCode = 400
}
