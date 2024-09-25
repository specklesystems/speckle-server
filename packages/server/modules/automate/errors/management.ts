import { BaseError } from '@/modules/shared/errors/base'

export class FunctionNotFoundError extends BaseError {
  static defaultMessage = 'Function not found'
  static code = 'FUNCTION_NOT_FOUND'
  static statusCode = 404
}

export class AutomationNotFoundError extends BaseError {
  static defaultMessage = 'Automation not found'
  static code = 'AUTOMATION_NOT_FOUND'
  static statusCode = 404
}

export class AutomationCreationError extends BaseError {
  static defaultMessage = 'Error creating automation'
  static code = 'AUTOMATION_CREATION_ERROR'
  static statusCode = 422
}

export class AutomationRevisionCreationError extends BaseError {
  static defaultMessage = 'Error creating automation revision'
  static code = 'AUTOMATION_REVISION_CREATION_ERROR'
  static statusCode = 422
}

export class AutomationUpdateError extends BaseError {
  static defaultMessage = 'Error updating automation'
  static code = 'AUTOMATION_UPDATE_ERROR'
  static statusCode = 422
}

export class AutomateAuthCodeHandshakeError extends BaseError {
  static defaultMessage = 'Error during auth code handshake'
  static code = 'AUTOMATE_AUTH_CODE_HANDSHAKE_ERROR'
  static statusCode = 500
}

export class AutomateInvalidTriggerError extends BaseError {
  static defaultMessage = 'Invalid automation trigger'
  static code = 'AUTOMATE_INVALID_TRIGGER'
  static statusCode = 422
}

export class AutomateFunctionCreationError extends BaseError {
  static defaultMessage = 'Error creating function'
  static code = 'AUTOMATE_FUNCTION_CREATION_ERROR'
  static statusCode = 400
}

export class AutomateFunctionUpdateError extends BaseError {
  static defaultMessage = 'Error updating function'
  static code = 'AUTOMATE_FUNCTION_UPDATE_ERROR'
  static statusCode = 400
}

export class AutomateFunctionReleaseNotFoundError extends BaseError {
  static defaultMessage = 'Function release not found'
  static code = 'AUTOMATE_FUNCTION_RELEASE_NOT_FOUND'
  static statusCode = 404
}

export class AutomationRevisionPublicKeyError extends BaseError {
  static defaultMessage = 'Error occurred when managing automation revision public key'
  static code = 'AUTOMATION_REVISION_PUBLIC_KEY_ERROR'
  static statusCode = 500
}

export class AutomationFunctionInputEncryptionError extends BaseError {
  static defaultMessage = 'Error encrypting automation function input'
  static code = 'AUTOMATION_FUNCTION_INPUT_ENCRYPTION_ERROR'
  static statusCode = 500
}

export class JsonSchemaInputValidationError extends BaseError {
  static defaultMessage = 'Error validating input data'
  static code = 'JSON_SCHEMA_INPUT_VALIDATION_ERROR'
  static statusCode = 400
}
