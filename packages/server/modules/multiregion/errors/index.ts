import { BaseError } from '@/modules/shared/errors'

export class MultiRegionSupportDisabledError extends BaseError {
  static code = 'MULTI_REGION_SUPPORT_DISABLED'
  static defaultMessage = 'Multi region support is disabled'
}

export class RegionCreateError extends BaseError {
  static code = 'REGION_CREATE_ERROR'
  static defaultMessage = 'An error occurred while creating the region'
  static statusCode = 400
}

export class RegionUpdateError extends BaseError {
  static code = 'REGION_UPDATE_ERROR'
  static defaultMessage = 'An error occurred while updating the region'
  static statusCode = 400
}
