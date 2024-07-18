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

export class WorkspaceQueryError extends BaseError {
  static defaultMessage = 'Unexpected error during query operation'
  static code = 'WORKSPACE_QUERY_ERROR'
}

export class WorkspacesNotYetImplementedError extends BaseError {
  static defaultMessage = 'Not yet implemented'
  static code = 'WORKSPACES_NOT_YET_IMPLEMENTED_ERROR'
}
