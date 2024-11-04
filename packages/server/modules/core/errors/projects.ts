import { BaseError } from '@/modules/shared/errors/base'

export class RegionalProjectCreationError extends BaseError {
  static defaultMessage = 'Cannot create project in region'
  static code = 'CREATE_PROJECT_REGION_SYNC_FAILED'
  static statusCode = 500
}

export class ProjectNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant project'
  static code = 'PROJECT_NOT_FOUND'
  static statusCode = 404
}
