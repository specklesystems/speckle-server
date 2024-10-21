import { BaseError } from '@/modules/shared/errors'

export class WorkspacePlanNotFoundError extends BaseError {
  static defaultMessage = 'Workspace plan not found'
  static code = 'WORKSPACE_PLAN_NOT_FOUND_ERROR'
  static statusCode = 500
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
