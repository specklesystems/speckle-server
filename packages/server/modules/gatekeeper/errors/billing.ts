import { BaseError } from '@/modules/shared/errors'

export class WorkspacePlanNotFoundError extends BaseError {
  static defaultMessage = 'Workspace plan not found'
  static code = 'WORKSPACE_PLAN_NOT_FOUND_ERROR'
  static statusCode = 500
}

export class WorkspacePlanMismatchError extends BaseError {
  static defaultMessage = 'Workspace plan is not matching the expected state'
  static code = 'WORKSPACE_PLAN_MISMATCH'
  static statusCode = 500
}

export class InvalidWorkspacePlanStatus extends BaseError {
  static defaultMessage = 'Workspace plan cannot be in the specified status'
  static code = 'INVALID_WORKSPACE_PLAN_STATUS'
  static statusCode = 400
}

export class WorkspaceCheckoutSessionInProgressError extends BaseError {
  static defaultMessage = 'Workspace already has a checkout session in progress'
  static code = 'WORKSPACE_CHECKOUT_SESSION_IN_PROGRESS_ERROR'
  static statusCode = 400
}

export class WorkspaceAlreadyPaidError extends BaseError {
  static defaultMessage = 'Workspace is already on a paid plan'
  static code = 'WORKSPACE_ALREADY_PAID_ERROR'
  static statusCode = 400
}

export class CheckoutSessionNotFoundError extends BaseError {
  static defaultMessage = 'Checkout session is not found'
  static code = 'CHECKOUT_SESSION_NOT_FOUND'
  static statusCode = 404
}

export class WorkspaceSubscriptionNotFoundError extends BaseError {
  static defaultMessage = 'Workspace subscription not found'
  static code = 'WORKSPACE_SUBSCRIPTION_NOT_FOUND'
  static statusCode = 404
}

export class WorkspaceNotPaidPlanError extends BaseError {
  static defaultMessage = 'Workspace is not on a paid plan'
  static code = 'WORKSPACE_NOT_PAID_PLAN'
  static statusCode = 400
}

export class WorkspacePlanDowngradeError extends BaseError {
  static defaultMessage = 'Workspace plan cannot be downgraded to a smaller plan'
  static code = 'WORKSPACE_PLAN_DOWNGRADE_ERROR'
  static statusCode = 400
}

export class WorkspaceReadOnlyError extends BaseError {
  static defaultMessage = 'Workspace is read-only'
  static code = 'WORKSPACE_READ_ONLY_ERROR'
  static statusCode = 403
}
