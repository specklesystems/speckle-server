import { BaseError } from '@/modules/shared/errors/base'

export class FunctionNotFoundError extends BaseError {
  static defaultMessage = 'Function not found'
  static code = 'FUNCTION_NOT_FOUND'
}

export class AutomationNotFoundError extends BaseError {
  static defaultMessage = 'Automation not found'
  static code = 'AUTOMATION_NOT_FOUND'
}
