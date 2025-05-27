import { BaseError } from '@/modules/shared/errors'

export class ModelNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant model'
  static code = 'MODEL_NOT_FOUND'
  static statusCode = 404
}
