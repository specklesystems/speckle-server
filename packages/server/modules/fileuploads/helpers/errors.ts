import { BaseError } from '@/modules/shared/errors'

//TODO this represents an internal server error and not a client/user error (e.g. error in a file content)
export class FileUploadInternalError extends BaseError {
  static defaultMessage = 'A file upload error occurred.'
  static code = 'FILE_UPLOAD_ERROR'
  static statusCode = 500
}

export class FileImportJobNotFoundError extends BaseError {
  static defaultMessage = 'The file upload job was not found.'
  static code = 'FILE_IMPORT_JOB_NOT_FOUND'
  static statusCode = 404
}

export class FileImportInvalidJobResultPayload extends BaseError {
  static defaultMessage = 'The file upload job result was invalid.'
  static code = 'FILE_IMPORT_INVALID_JOB_RESULT_PAYLOAD'
  static statusCode = 400
}
