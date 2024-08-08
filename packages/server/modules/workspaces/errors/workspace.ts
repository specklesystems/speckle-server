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

export class WorkspaceInvalidLogoError extends BaseError {
  static defaultMessage = 'Provided logo is not valid'
  static code = 'WORKSPACE_INVALID_LOGO_ERROR'
}

export class WorkspaceQueryError extends BaseError {
  static defaultMessage = 'Unexpected error during query operation'
  static code = 'WORKSPACE_QUERY_ERROR'
}

export class WorkspacesNotAuthorizedError extends BaseError {
  static defaultMessage = 'You are not authorized'
  static code = 'WORKSPACES_NOT_AUTHORIZED_ERROR'
  static statusCode = 401
}

export class WorkspacesNotYetImplementedError extends BaseError {
  static defaultMessage = 'Not yet implemented'
  static code = 'WORKSPACES_NOT_YET_IMPLEMENTED_ERROR'
}

export class WorkspaceNotFoundError extends BaseError {
  static defaultMessage = 'Workspace not found'
  static code = 'WORKSPACE_NOT_FOUND_ERROR'
  static statusCode = 404
}

export class WorkspaceUnverifiedDomainError extends BaseError {
  static defaultMessage = 'Cannot add unverified domain to workspace'
  static code = 'WORKSPACE_UNVERIFIED_DOMAIN_ERROR'
  static statusCode = 403
}

export class WorkspaceDomainBlockedError extends BaseError {
  static defaultMessage = 'Cannot add blocked domain to workspace'
  static code = 'WORKSPACE_DOMAIN_BLOCKED_ERROR'
  static statusCode = 400
}

export class WorkspaceProtectedError extends BaseError {
  static defaultMessage = 'Workspace protected'
  static code = 'WORKSPACE_PROTECTED'
  static statusCode = 400
}
