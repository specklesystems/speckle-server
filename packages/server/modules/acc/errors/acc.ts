import { BaseError } from '@/modules/shared/errors/base'

export class AccModuleDisabledError extends BaseError {
  static defaultMessage = 'ACC integration module is disabled'
  static code = 'ACC_MODULE_DISABLED'
  static statusCode = 423
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
