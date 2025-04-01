import { BaseError } from '@/modules/shared/errors/base'

export class SsoSessionMissingOrExpiredError extends BaseError<{
  workspaceSlug: string
}> {
  static defaultMessage =
    'No valid SSO session found for the given workspace. Please sign in.'
  static code = 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
  static statusCode = 401
}
