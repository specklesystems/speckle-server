import { BaseError } from '@/modules/shared/errors/base'

export class InviteCreateValidationError extends BaseError {
  static code = 'INVITE_CREATE_ERROR'
  static defaultMessage = 'An issue occurred while trying to create an invitation'
  static statusCode = 400
}

export class InviteFinalizingError extends BaseError {
  static code = 'INVITE_FINALIZING_ERROR'
  static defaultMessage = 'An issue occurred while finalizing the invitation'
  static statusCode = 400
}

export class InviteFinalizedForNewEmail extends BaseError {
  static code = 'INVITE_FINALIZED_FOR_NEW_EMAIL'
  static defaultMessage =
    'Attempted to finalize an invite for a mismatched e-mail address'
  static statusCode = 400
}

export class InviteNotFoundError extends BaseError {
  static code = 'INVITE_NOT_FOUND'
  static defaultMessage = 'No invitation for the related resources was found'
  static statusCode = 400
}
