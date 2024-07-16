import { BaseError } from '@/modules/shared/errors/base'

export class InviteCreateValidationError extends BaseError {
  static code = 'INVITE_CREATE_ERROR'
  static defaultMessage = 'An issue occurred while trying to create an invitation'
}

export class NoInviteFoundError extends BaseError {
  static code = 'NO_INVITE_FOUND'
  static defaultMessage = 'No invitation for the related resources was found'
}

export class ResourceNotResolvableError extends BaseError {
  static code = 'INVITE_RESOURCE_NOT_RESOLVABLE'
  static defaultMessage = "Invite's associated resource could not be resolved"
}
