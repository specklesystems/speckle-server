import { BaseError } from '@/modules/shared/errors/base'

export class RegionalProjectCreationError extends BaseError {
  static defaultMessage = 'Cannot create project in region'
  static code = 'CREATE_PROJECT_REGION_SYNC_FAILED'
  static statusCode = 500
}
