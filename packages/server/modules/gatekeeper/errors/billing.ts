import { BaseError } from '@/modules/shared/errors'

export class WorkspacePlanNotFoundError extends BaseError {
  static defaultMessage = 'Workspace plan not found'
  static code = 'WORKSPACE_PLAN_NOT_FOUND_ERROR'
  static statusCode = 500
}

export class WorkspaceAlreadyPaidError extends BaseError {
  static defaultMessage = 'Workspace is already on a paid plan'
  static code = 'WORKSPACE_ALREADY_PAID_ERROR'
  static statusCode = 400
}
