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

export class FileImportInvalidJobProgressPayload extends BaseError {
  static defaultMessage = 'The file upload job progress report was invalid.'
  static code = 'FILE_IMPORT_INVALID_JOB_PROGRESS_PAYLOAD'
  static statusCode = 400
}

export class UnsupportedFileTypeError extends BaseError {
  static code = 'UNSUPPORTED_FILE_TYPE'
  static defaultMessage = 'The provided file type is not supported for importing.'
  static statusCode = 400
}
