import { BaseError } from '@/modules/shared/errors'

export class StoredBlobAccessError extends BaseError {
  static code = 'STORED_BLOB_ACCESS_ERROR'
  static defaultMessage = 'An issue occurred while attempting to access a stored blob.'
  static statusCode = 400
}
