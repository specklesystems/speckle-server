import { BaseError } from '@/modules/shared/errors'

export class StoredBlobAccessError extends BaseError {
  static code = 'STORED_BLOB_ACCESS_ERROR'
  static defaultMessage = 'An issue occurred while attempting to access a stored blob.'
  static statusCode = 400
}

export class AlreadyRegisteredBlobError extends BaseError {
  static code = 'ALREADY_REGISTERED_BLOB_ERROR'
  static defaultMessage = 'The blob is already registered as having been uploaded.'
  static statusCode = 400
}
