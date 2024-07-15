import { BaseError } from '@/modules/shared/errors/base'

export class WorkspaceAdminRequiredError extends BaseError {
  static defaultMessage = 'Cannot remove last admin from a workspace'
  static code = 'WORKSPACE_ADMIN_REQUIRED_ERROR'
  static statusCode = 400
}

export class WorkspaceInvalidRoleError extends BaseError {
  static defaultMessage = 'Invalid workspace role provided'
  static code = 'WORKSPACE_INVALID_ROLE_ERROR'
}
