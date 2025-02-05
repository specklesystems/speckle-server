import { BaseError } from '@/modules/shared/errors'

export class FeatureAccessForbiddenError extends BaseError {
  static defaultMessage = 'Access to feature forbidden by current plan level.'
  static code = 'GATEKEEPER_FEATURE_ACCESS_FORBIDDEN_ERROR'
  static statusCode = 403
}
