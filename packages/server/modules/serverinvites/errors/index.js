const { BaseError } = require('@/modules/shared/errors/base')

class InviteCreateValidationError extends BaseError {
  static code = 'INVITE_CREATE_ERROR'
  static defaultMessage = 'An issue occurred while trying to create an invitation'
}

class NoInviteFoundError extends BaseError {
  static code = 'NO_INVITE_FOUND'
  static defaultMessage = 'No invitation for the related resources was found'
}

module.exports = {
  InviteCreateValidationError,
  NoInviteFoundError
}
