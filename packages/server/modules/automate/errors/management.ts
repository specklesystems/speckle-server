import { BaseError } from '@/modules/shared/errors/base'

export class FunctionNotFoundError extends BaseError {
  static defaultMessage = 'Function not found'
  static code = 'FUNCTION_NOT_FOUND'
}

export class AutomationNotFoundError extends BaseError {
  static defaultMessage = 'Automation not found'
  static code = 'AUTOMATION_NOT_FOUND'
}

export class AutomateCreationError extends BaseError {
  static defaultMessage = 'Error creating automation'
  static code = 'AUTOMATE_CREATION_ERROR'
}

export class AutomateAuthCodeHandshakeError extends BaseError {
  static defaultMessage = 'Error during auth code handshake'
  static code = 'AUTOMATE_AUTH_CODE_HANDSHAKE_ERROR'
}

export class AutomateInvalidTriggerError extends BaseError {
  static defaultMessage = 'Invalid automation trigger'
  static code = 'AUTOMATE_INVALID_TRIGGER'
}

export class AutomateFunctionCreationError extends BaseError {
  static defaultMessage = 'Error creating function'
  static code = 'AUTOMATE_FUNCTION_CREATION_ERROR'
}

export class AutomateFunctionUpdateError extends BaseError {
  static defaultMessage = 'Error updating function'
  static code = 'AUTOMATE_FUNCTION_UPDATE_ERROR'
}

export class AutomateFunctionReleaseCreateError extends BaseError {
  static defaultMessage = 'Error creating function release'
  static code = 'AUTOMATE_FUNCTION_RELEASE_CREATE_ERROR'
}
