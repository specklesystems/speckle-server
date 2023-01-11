import { BaseError } from '@/modules/shared/errors/base'

export class StreamAccessUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while changing stream access rights'
  static code = 'STREAM_ACCESS_UPDATE_ERROR'
}

export class StreamInvalidAccessError extends BaseError {
  static defaultMessage = 'User does not have access to the specified stream'
  static code = 'STREAM_INVALID_ACCESS_ERROR'
}

export class StreamCloneError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to clone a stream'
  static code = 'STREAM_CLONE_ERROR'
}

export class StreamUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to update a stream'
  static code = 'STREAM_UPDATE_ERROR'
}
