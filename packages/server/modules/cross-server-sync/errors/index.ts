import { BaseError } from '@/modules/shared/errors'

export class CrossServerCommitSyncError extends BaseError {
  static code = 'CROSS_SERVER_COMMIT_SYNC_ERROR'
  static defaultMessage = 'Cross-server commit sync failed unexpectedly'
  static statusCode = 500
}

export class CrossServerProjectSyncError extends BaseError {
  static code = 'CROSS_SERVER_PROJECT_SYNC_ERROR'
  static defaultMessage = 'Cross-server project sync failed unexpectedly'
  static statusCode = 400
}
