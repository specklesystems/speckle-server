import { BaseError } from '@/helpers/errorHelper'

export class ComposableInvokedOutOfScopeError extends BaseError {
  static defaultMessage =
    'getCurrentInstance() returned null. Method must be called at the top of a setup function'
}
