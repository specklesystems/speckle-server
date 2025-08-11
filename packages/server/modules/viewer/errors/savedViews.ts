import { BaseError } from '@/modules/shared/errors'

export class SavedViewCreationValidationError extends BaseError {
  static code = 'SAVED_VIEW_CREATION_VALIDATION_ERROR'
  static defaultMessage = 'Saved view creation failed due to a validation error'
  static statusCode = 400
}

export class SavedViewGroupCreationValidationError extends BaseError {
  static code = 'SAVED_VIEW_GROUP_CREATION_VALIDATION_ERROR'
  static defaultMessage = 'Saved view group creation failed due to a validation error'
  static statusCode = 400
}

export class SavedViewInvalidResourceTargetError extends BaseError {
  static code = 'SAVED_VIEW_INVALID_RESOURCE_TARGET_ERROR'
  static defaultMessage = 'Invalid resource ids specified'
  static statusCode = 400
}

export class SavedViewUpdateValidationError extends BaseError {
  static code = 'SAVED_VIEW_UPDATE_VALIDATION_ERROR'
  static defaultMessage = 'Saved view update failed due to a validation error'
  static statusCode = 400
}
