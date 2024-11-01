import { BaseError } from '@/modules/shared/errors'

export class MultiRegionSupportDisabledError extends BaseError {
  static code = 'MULTI_REGION_SUPPORT_DISABLED'
  static defaultMessage = 'Multi region support is disabled'
}
