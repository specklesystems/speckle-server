import { BaseError } from '@/modules/shared/errors/base'

export class WorkspaceAdminRequiredError extends BaseError {
  static defaultMessage = 'Cannot remove last admin from a workspace'
  static code = 'WORKSPACE_ADMIN_REQUIRED_ERROR'
  static statusCode = 400
}

export class WorkspacesNotYetImplementedError extends BaseError {
  static defaultMessage = 'Not yet implemented'
  static code = 'WORKSPACES_NOT_YET_IMPLEMENTED_ERROR'
}
