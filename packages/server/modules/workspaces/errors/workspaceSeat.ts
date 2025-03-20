import { BaseError } from '@/modules/shared/errors'

export class InvalidWorkspaceSeatTypeError extends BaseError {
  static defaultMessage = 'Workspace seat type is invalid'
  static code = 'INDALID_WORKSPACE_SEAT_TYPE_ERROR'
  static statusCode = 400
}
