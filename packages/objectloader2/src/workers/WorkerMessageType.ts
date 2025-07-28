export enum WorkerMessageType {
  INIT_QUEUES = 'INIT_QUEUES',
  DISPOSE = 'DISPOSE'
}
export function handleError(
  e: unknown,
  formatErrorMessage: (err: Error) => string
): void {
  if (e instanceof Error) {
    // Use the provided callback to format the error message
    console.error(formatErrorMessage(e))
  } else {
    console.error('Caught an unknown type of error:', e)
  }
}

export type LogErrorFunction = (
  e: unknown,
  formatErrorMessage: (err: Error) => string
) => void
