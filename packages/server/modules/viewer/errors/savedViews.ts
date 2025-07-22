import { BaseError } from '@/modules/shared/errors'

export class SavedViewCreationValidationError extends BaseError {
  static code = 'SAVED_VIEW_CREATION_VALIDATION_ERROR'
  static defaultMessage = 'Saved view creation failed due to a validation error'
  static statusCode = 400
}

export class DuplicateSavedViewError extends BaseError {
  static code = 'DUPLICATE_SAVED_VIEW_ERROR'
  static defaultMessage =
    'A saved view with the same name & group already exists in this project'
  static statusCode = 400
}
