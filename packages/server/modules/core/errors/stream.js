const { BaseError } = require('@/modules/shared/errors/base')

class StreamAccessUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while changing stream access rights'
  static code = 'STREAM_ACCESS_UPDATE_ERROR'
}

module.exports = {
  StreamAccessUpdateError
}
