import { BaseError } from '@/modules/shared/errors'

export class InvalidAccessCodeRequestError extends BaseError {
  static code = 'INVALID_ACCESS_CODE_REQUEST'
  static defaultMessage = 'An issue occurred while generating an access code for an app'
  static statusCode = 400
}

export class AppCreateError extends BaseError {
  static code = 'APP_CREATE'
  static defaultMessage = 'An issue occurred while creating an app'
  static statusCode = 400
}

export class AccessCodeNotFoundError extends BaseError {
  static code = 'ACCESS_CODE_NOT_FOUND'
  static defaultMessage = 'An issue occurred while trying to find the access code'
  static statusCode = 404
}

export class AppTokenCreateError extends BaseError {
  static code = 'APP_TOKEN_CREATE'
  static defaultMessage = 'An issue occurred while creating an app token'
  static statusCode = 400
}

export class RefreshTokenNotFound extends BaseError {
  static code = 'REFRESH_TOKEN_NOT_FOUND'
  static defaultMessage = 'An issue occurred while trying to find the refresh token'
  static statusCode = 404
}

export class RefreshTokenError extends BaseError {
  static code = 'REFRESH_TOKEN'
  static defaultMessage = 'An issue occurred while refreshing a token'
  static statusCode = 400
}
