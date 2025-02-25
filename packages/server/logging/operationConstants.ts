/**
 * Helper constants for operation status when logging.
 * Intended to be used with the `operationStatus` field when logging.
 * Helps to avoid typos and ensure consistency.
 */
export const STATUS = {
  START: 'start',
  SUCCESS: 'success',
  FAILURE: 'failure'
} as const
