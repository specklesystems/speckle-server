/**
 * Helper constants for log fields.
 * Intended to be used as values when logging.
 */

/**
 * Operation status values.
 * Intended to be used with the `operationStatus` field when logging.
 * Helps to avoid typos and ensure consistency.
 */
const STATUS = {
  START: 'start',
  SUCCESS: 'success',
  FAILURE: 'failure'
} as const

export const OperationStatus = {
  start: {
    operationStatus: STATUS.START
  },
  success: {
    operationStatus: STATUS.SUCCESS
  },
  failure: {
    operationStatus: STATUS.FAILURE
  }
} as const

export const OperationName = (name: string) => ({
  operationName: name
})
