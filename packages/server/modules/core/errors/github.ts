import { BaseError } from '@/modules/shared/errors'

export class InvalidRepoUrlError extends BaseError {
  static defaultMessage = 'Invalid Git repository URL'
  static code = 'INVALID_REPO_URL'
}

export class UnsupportedProviderError extends BaseError {
  static defaultMessage =
    'Unsupported Git provider - only GitHub is supported at the moment'
  static code = 'UNSUPPORTED_GIT_PROVIDER'
}

export class NotFoundOrPrivateRepoError extends BaseError {
  static defaultMessage = 'Git repository not found or is private'
  static code = 'NOT_FOUND_OR_PRIVATE_REPO'
}

export class BadVerificationCodeError extends BaseError {
  static defaultMessage = 'Bad GitHub app verification code'
  static code = 'BAD_VERIFICATION_CODE'
}

export class InvalidTokenError extends BaseError {
  static defaultMessage = 'Invalid GitHub auth token'
  static code = 'INVALID_GH_TOKEN'
}

export class OrgAuthAccessRestrictionsError extends BaseError {
  static defaultMessage =
    'The GitHub app is not authorized to use the specified template'
  static code = 'ORG_AUTH_ACCESS_RESTRICTIONS'
}

export class InvalidOwnerError extends BaseError {
  static defaultMessage = 'Invalid repository owner'
  static code = 'INVALID_OWNER'
}

export class DuplicateRepoNameError extends BaseError {
  static defaultMessage = 'Duplicate repository name'
  static code = 'DUPLICATE_REPO_NAME'
}

export class SecretEncryptionFailedError extends BaseError {
  static defaultMessage = 'Failed to encrypt secret'
  static code = 'SECRET_ENCRYPTION_FAILED'
}
