import { BaseError } from '@/modules/shared/errors'

//TODO this represents an internal server error and not a client/user error (e.g. error in a file content)
export class FileUploadInternalError extends BaseError {
  static defaultMessage = 'A file upload error occurred.'
  static code = 'FILE_UPLOAD_ERROR'
  static statusCode = 500
}
