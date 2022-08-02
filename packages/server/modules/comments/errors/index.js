const { BaseError } = require('@/modules/shared/errors/base')

class InvalidAttachmentsError extends BaseError {
  static defaultMessage = 'Invalid comment attachments specified'
  static code = 'INVALID_ATTACHMENTS'
}

module.exports = {
  InvalidAttachmentsError
}
