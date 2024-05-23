import { BaseError } from '~~/lib/core/errors/base'

export class AutomationPublicKeysRetrievalError extends BaseError {
  static defaultMessage = 'Failed to retrieve automation public keys'
}
