import { BaseError } from '@speckle/ui-components'

export {
  BaseError,
  LogicError,
  UninitializedResourceAccessError,
  ComposableInvokedOutOfScopeError,
  UnsupportedEnvironmentError
} from '@speckle/ui-components'

export class ResourceLoadError extends BaseError {
  static override defaultMessage = 'External resource failed to load'
}
