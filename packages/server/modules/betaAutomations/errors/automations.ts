import { BaseError } from '@/modules/shared/errors/base'

export class AutomationNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant automation'
  static code = 'AUTOMATION_NOT_FOUND'
}
