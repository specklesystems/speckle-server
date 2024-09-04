import { BaseError } from '@/modules/shared/errors/base'

export class WorkspaceAdminError extends BaseError {
  static defaultMessage = 'Cannot perform this action on workspace admins'
  static code = 'WORKSPACE_ADMIN_ERROR'
  static statusCode = 400
}

export class WorkspaceAdminRequiredError extends BaseError {
  static defaultMessage = 'Cannot remove last admin from a workspace'
  static code = 'WORKSPACE_ADMIN_REQUIRED_ERROR'
  static statusCode = 400
}

export class WorkspaceInvalidDescriptionError extends BaseError {
  static defaultMessage = 'Provided description is too long'
  static code = 'WORKSPACE_INVALID_DESCRIPTION_ERROR'
  static statusCode = 400
}

export class WorkspaceInvalidRoleError extends BaseError {
  static defaultMessage = 'Invalid workspace role provided'
  static code = 'WORKSPACE_INVALID_ROLE_ERROR'
  static statusCode = 400
}

export class WorkspaceInvalidLogoError extends BaseError {
  static defaultMessage = 'Provided logo is not valid'
  static code = 'WORKSPACE_INVALID_LOGO_ERROR'
  static statusCode = 400
}

export class WorkspaceInvalidProjectError extends BaseError {
  static defaultMessage = 'Provided project does not belong to a workspace'
  static code = 'WORKSPACE_INVALID_PROJECT_ERROR'
  static statusCode = 400
}

export class WorkspaceNoVerifiedDomainsError extends BaseError {
  static defaultMessage = 'Invalid operation, the workspace has no verified domains'
  static code = 'WORKSPACE_NO_VERIFIED_DOMAINS'
  static statusCode = 400
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

export class WorkspaceNotDiscoverableError extends BaseError {
  static defaultMessage = 'Workspace is not discoverable'
  static code = 'WORKSPACE_NOT_DISCOVERABLE'
  static statusCode = 400
}

export class WorkspaceNotJoinableError extends BaseError {
  static defaultMessage = 'Workspace is not joinable'
  static code = 'WORKSPACE_NOT_JOINABLE'
  static statusCode = 400
}

export class WorkspaceJoinNotAllowedError extends BaseError {
  static defaultMessage = 'You do not have permissions to join this workspace'
  static code = 'WORKSPACE_JOIN_NOT_ALLOWED'
  static statusCode = 403
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

export class WorkspaceDomainsInvalidState extends BaseError {
  static defaultMessage = 'Workspace has no verified domains'
  static code = 'WORKSPACE_NO_VERIFIED_DOMAINS'
  static statusCode = 500
}
