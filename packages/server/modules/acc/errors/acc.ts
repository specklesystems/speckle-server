import { BaseError } from '@/modules/shared/errors/base'

export class AccModuleDisabledError extends BaseError {
  static defaultMessage = 'ACC integration module is disabled'
  static code = 'ACC_MODULE_DISABLED'
  static statusCode = 423
}

export class AccNotAuthorizedError extends BaseError {
  static defaultMessage = 'ACC token missing or not authorized'
  static code = 'ACC_MODULE_NOT_AUTHORIZED'
  static statusCode = 401
}

export class AccNotYetImplementedError extends BaseError {
  static defaultMessage = 'This functionality for the ACC integration is not yet implemented'
  static code = 'ACC_MODULE_NOT_YET_IMPLEMENTED'
  static statusCode = 501
}

export class DuplicateSyncItemError extends BaseError {
  static defaultMessage = 'A sync item with this lineage urn already exists.'
  static code = 'ACC_DUPLICATE_SYNC_ITEM_LINEAGE_URN'
  static statusCode = 423

  constructor(lineageUrn: string) {
    super()
    this.message = `A sync item with lineage urn "${lineageUrn}" already exists.`
  }
}

export class SyncItemNotFoundError extends BaseError {
  static defaultMessage = 'Sync item not found'
  static code = 'ACC_SYNC_ITEM_NOT_FOUND'
  static statusCode = 404
}

export class SyncItemAutomationTriggerError extends BaseError {
  static defaultMessage = 'Failed to trigger automation associated with sync item'
  static code = 'ACC_SYNC_ITEM_AUTOMATION_TRIGGER_ERROR'
  static statusCode = 422
}

export class SyncItemUnsupportedFileExtensionError extends BaseError {
  static defaultMessage = 'Cannot sync this file type from ACC'
  static code = 'ACC_SYNC_ITEM_UNSUPPORTED_FILE_EXTENSION'
  static statusCode = 422

  constructor(fileExtension: string) {
    super()
    this.message = `Received sync item update with unsupported file extension ${fileExtension}`
  }
}
