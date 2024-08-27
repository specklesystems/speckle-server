import { BaseError } from '@/modules/shared/errors/base'

export class InviteCreateValidationError extends BaseError {
  static code = 'INVITE_CREATE_ERROR'
  static defaultMessage = 'An issue occurred while trying to create an invitation'
}

export class InviteFinalizingError extends BaseError {
  static code = 'INVITE_FINALIZING_ERROR'
  static defaultMessage = 'An issue occurred while finalizing the invitation'
}

export class InviteFinalizedForNewEmail extends BaseError {
  static code = 'INVITE_FINALIZED_FOR_NEW_EMAIL'
  static defaultMessage =
    'Attempted to finalize an invite for a mismatched e-mail address'
}

export class NoInviteFoundError extends BaseError {
  static code = 'NO_INVITE_FOUND'
  static defaultMessage = 'No invitation for the related resources was found'
  static statusCode = 404
}

export class ResourceNotResolvableError extends BaseError {
  static code = 'INVITE_RESOURCE_NOT_RESOLVABLE'
  static defaultMessage = "Invite's associated resource could not be resolved"
}
