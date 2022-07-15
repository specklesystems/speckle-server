const { BaseError } = require('@/modules/shared/errors/base')

class StreamAccessUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while changing stream access rights'
  static code = 'STREAM_ACCESS_UPDATE_ERROR'
}

class StreamInvalidAccessError extends BaseError {
  static defaultMessage = 'User does not have access to the specified stream'
  static code = 'STREAM_INVALID_ACCESS_ERROR'
}

module.exports = {
  StreamAccessUpdateError,
  StreamInvalidAccessError
}
