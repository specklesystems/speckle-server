import { BaseError } from '@/modules/shared/errors'

export class UnsupportedFileTypeError extends BaseError {
  static code = 'UNSUPPORTED_FILE_TYPE'
  static defaultMessage = 'The provided file type is not supported for importing.'
  static statusCode = 400
}
