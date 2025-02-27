import { BaseError } from '@/modules/shared/errors'

export class InvalidWorkspaceSeatType extends BaseError {
  static defaultMessage = 'Workspace seat type is invalid'
  static code = 'INDALID_WORKSPACE_SEAT_TYPE'
  static statusCode = 400
}
