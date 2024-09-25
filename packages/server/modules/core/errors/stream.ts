import { BaseError } from '@/modules/shared/errors/base'

export class StreamAccessUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while changing stream access rights'
  static code = 'STREAM_ACCESS_UPDATE_ERROR'
  static statusCode = 400
}

export class StreamInvalidAccessError extends BaseError {
  static defaultMessage = 'User does not have access to the specified stream'
  static code = 'STREAM_INVALID_ACCESS_ERROR'
  static statusCode = 403
}

export class StreamCloneError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to clone a stream'
  static code = 'STREAM_CLONE_ERROR'
  static statusCode = 500
}

export class StreamUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to update a stream'
  static code = 'STREAM_UPDATE_ERROR'
  static statusCode = 400
}

export class StreamNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant stream'
  static code = 'STREAM_NOT_FOUND'
  static statusCode = 404
}
