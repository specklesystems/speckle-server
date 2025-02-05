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

export class WorkspaceInvalidUpdateError extends BaseError {
  static defaultMessage = 'Provided workspace update input is invalid or malformed'
  static code = 'WORKSPACE_INVALID_UPDATE_ERROR'
  static statusCode = 400
}

export class WorkspaceSlugTakenError extends BaseError {
  static defaultMessage = 'The given workspace slug is already taken'
  static code = 'WORKSPACE_SLUG_TAKEN'
  static statusCode = 400
}

export class WorkspaceSlugInvalidError extends BaseError {
  static defaultMessage = 'The workspace slug is invalid'
  static code = 'WORKSPACE_SLUG_INVALID'
  static statusCode = 400
}

export class WorkspaceInvalidRoleError extends BaseError {
  static defaultMessage = 'Invalid workspace role provided'
  static code = 'WORKSPACE_INVALID_ROLE_ERROR'
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
  static statusCode = 500
}

export class WorkspacesNotAuthorizedError extends BaseError {
  static defaultMessage = 'You are not authorized'
  static code = 'WORKSPACES_NOT_AUTHORIZED_ERROR'
  static statusCode = 401
}

export class WorkspacesNotYetImplementedError extends BaseError {
  static defaultMessage = 'Not yet implemented'
  static code = 'WORKSPACES_NOT_YET_IMPLEMENTED_ERROR'
  static statusCode = 501
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

export class WorkspacePaidPlanActiveError extends BaseError {
  static defaultMessage = 'Workspace has an active paid plan, cancel it first'
  static code = 'WORKSPACE_PAID_PLAN_ACTIVE'
  static statusCode = 400
}
