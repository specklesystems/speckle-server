import { BaseError } from '@/modules/shared/errors'

export class MultiRegionSupportDisabledError extends BaseError {
  static code = 'MULTI_REGION_SUPPORT_DISABLED'
  static defaultMessage = 'Multi region support is disabled'
}

export class RegionKeyInvalidError extends BaseError {
  static code = 'REGION_KEY_INVALID_ERROR'
  static defaultMessage = 'Region key is not valid'
  static statusCode = 400
}

export class RegionKeyTakenError extends BaseError {
  static code = 'REGION_KEY_TAKEN_ERROR'
  static defaultMessage = 'Region with this key already exists'
  static statusCode = 400
}

export class RegionUpdateError extends BaseError {
  static code = 'REGION_UPDATE_ERROR'
  static defaultMessage = 'An error occurred while updating the region'
  static statusCode = 400
}
