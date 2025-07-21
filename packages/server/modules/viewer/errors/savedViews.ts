import { BaseError } from '@/modules/shared/errors'

export class SavedViewCreationValidationError extends BaseError {
  static code = 'SAVED_VIEW_CREATION_VALIDATION_ERROR'
  static defaultMessage = 'Saved view creation failed due to a validation error'
  static statusCode = 400
}
