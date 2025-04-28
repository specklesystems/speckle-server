import { BaseError } from '@/modules/shared/errors'

export class MultiRegionNotYetImplementedError extends BaseError {
  static code = 'MULTI_REGION_NOT_YET_IMPLEMENTED_ERROR'
  static defaultMessage = 'Not yet implemented.'
}

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

export class MultiRegionInvalidJobError extends BaseError {
  static code = 'MULTI_REGION_INVALID_JOB_ERROR'
  static defaultMessage = 'Attempted to process malformed job in queue.'
}
