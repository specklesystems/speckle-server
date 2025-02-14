import { BaseError } from '@/modules/shared/errors/base'

export class CookieParserError extends BaseError {
  static defaultMessage = 'Error parsing cookies'
  static code = 'COOKIE_PARSER_ERROR'
  static statusCode = 400
}

export class HttpLoggerError extends BaseError {
  static defaultMessage = 'Error in Http logger'
  static code = 'EXPRESS_LOGGER_ERROR'
  static statusCode = 500
}

export class CompressionError extends BaseError {
  static defaultMessage = 'Error in compression middleware'
  static code = 'COMPRESSION_ERROR'
  static statusCode = 500
}

export class CorsMiddlewareError extends BaseError {
  static defaultMessage = 'Error in CORS middleware'
  static code = 'CORS_MIDDLEWARE_ERROR'
  static statusCode = 500
}

export class PrometheusExpressMetricsError extends BaseError {
  static defaultMessage = 'Error in Prometheus Express metrics middleware'
  static code = 'PROMETHEUS_EXPRESS_METRICS_ERROR'
  static statusCode = 500
}

export class FrontendProxyError extends BaseError {
  static defaultMessage = 'Error in frontend proxy middleware'
  static code = 'FRONTEND_PROXY_ERROR'
  static statusCode = 500
}

export class PassportAuthError extends BaseError {
  static defaultMessage = 'Error in Passport authentication middleware'
  static code = 'PASSPORT_AUTH_ERROR'
  static statusCode = 500
}
