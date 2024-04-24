import { BaseError } from '@/modules/shared/errors'

export class InvalidFunctionTemplateError extends BaseError {
  static defaultMessage = 'Invalid function template'
  static code = 'INVALID_FUNCTION_TEMPLATE'
}

export class MissingAutomateGithubAuthError extends BaseError {
  static defaultMessage = 'Missing GitHub app auth data'
  static code = 'MISSING_AUTOMATE_GITHUB_AUTH'
}

export class InvalidRepositoryUrlError extends BaseError {
  static defaultMessage = 'Invalid Git repository URL'
  static code = 'INVALID_REPO_URL'
}

export class MisconfiguredTemplateOrgError extends BaseError {
  static defaultMessage = 'Misconfigured template organization'
  static code = 'AUTOMATE_MISCONFIGURED_TEMPLATE_ORG'
}

export class RepoSecretsCouldNotBeUpdatedError extends BaseError {
  static defaultMessage = 'One or more repo secrets could not be updated'
  static code = 'REPO_SECRETS_COULD_NOT_BE_UPDATED'
}
