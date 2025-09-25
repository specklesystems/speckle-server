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

export class SavedViewInvalidHomeViewSettingsError extends BaseError {
  static code = 'SAVED_VIEW_INVALID_HOME_VIEW_SETTINGS_ERROR'
  static defaultMessage = 'Invalid home view settings specified'
  static statusCode = 400
}

export class SavedViewUpdateValidationError extends BaseError {
  static code = 'SAVED_VIEW_UPDATE_VALIDATION_ERROR'
  static defaultMessage = 'Saved view update failed due to a validation error'
  static statusCode = 400
}

export class SavedViewGroupUpdateValidationError extends BaseError {
  static code = 'SAVED_VIEW_GROUP_UPDATE_VALIDATION_ERROR'
  static defaultMessage = 'Saved view group update failed due to a validation error'
  static statusCode = 400
}

export class SavedViewGroupNotFoundError extends BaseError {
  static code = 'SAVED_VIEW_GROUP_NOT_FOUND_ERROR'
  static defaultMessage = 'Saved view group not found'
  static statusCode = 404
}

export class SavedViewPositionUpdateError extends BaseError {
  static code = 'SAVED_VIEW_POSITION_UPDATE_ERROR'
  static defaultMessage = 'Failed to update saved view position'
  static statusCode = 400
}

export class SavedViewPreviewRetrievalError extends BaseError {
  static code = 'SAVED_VIEW_PREVIEW_RETRIEVAL_ERROR'
  static defaultMessage = 'Could not retrieve saved view preview'
  static statusCode = 400
}
